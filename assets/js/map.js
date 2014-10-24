window.onload=function(){

  // ############################
  // Screenshot
  // ############################
  L.Control.Screenshot = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
        position: 'bottomleft',
        title: 'Impression'
    },

    screenshot: function () {
        Ortho44.fadeOut("#overlay", 40, function() {
          var page = location.href;
          var screamshot = "http://screamshot.makina-corpus.net/capture/?render=html&waitfor=.map-initialized&url=";
          window.open(screamshot + encodeURIComponent(page));
        });
    },

    onAdd: function(map) {
        this.map = map;
        this._container = L.DomUtil.create('div', 'leaflet-print-control leaflet-control');
        var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-screenshot-control', this._container);
        link.href = '#';
        link.title = this.options.title;
        var span = L.DomUtil.create('span', 'sprite-print', link);

        L.DomEvent
            .addListener(link, 'click', L.DomEvent.stopPropagation)
            .addListener(link, 'click', L.DomEvent.preventDefault)
            .addListener(link, 'click', this.screenshot, this);
        return this._container;
    }
  });
  L.control.screenshot = function(map) {
    return new L.Control.Screenshot(map);
  };

  // ############################
  // Snippet
  // ############################
  L.Control.Snippet = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
        position: 'bottomleft',
        title: 'Partager sur votre site ou blog'
    },

    generate: function() {
      var center = this.map.getCenter(),
          zoom = this.map.getZoom(),
          precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

      script = document.querySelector("#snippet #snippet-template").textContent;
      script = script.replace(/_zoom_/, zoom);
      script = script.replace(/_lat_/, center.lat.toFixed(precision));
      script = script.replace(/_lon_/, center.lng.toFixed(precision));
      document.querySelector("#snippet #snippet-code").textContent = script;
    },
    onAdd: function(map) {
        this.map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-embed leaflet-control');
        var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-snippet-control', this._container);
        link.href = '#';
        link.title = this.options.title;
        link.setAttribute("data-reveal-id", "snippet");
        var span = L.DomUtil.create('i', 'sprite-code', link);

        L.DomEvent
        //     .addListener(link, 'click', L.DomEvent.stopPropagation)
        //     .addListener(link, 'click', L.DomEvent.preventDefault)
             .addListener(link, 'click', this.generate , this);

        return this._container;
    }
  });
  L.control.snippet = function(map) {
    return new L.Control.Snippet(map);
  };

  // ############################
  // Locator
  // ############################
  L.Control.Locator = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
        position: 'topleft',
        title: 'Localisation'
    },

    locate: function() {
      this.map.locate();
    },
    onAdd: function(map) {
        this.map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-zoom leaflet-control');
        var div = L.DomUtil.create('div', 'leaflet-bar', this._container);
        var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-locate-control', div);
        link.href = '#';
        link.title = this.options.title;
        var span = L.DomUtil.create('i', 'sprite-zposition', link);

        L.DomEvent
             .addListener(link, 'click', L.DomEvent.stopPropagation)
             .addListener(link, 'click', L.DomEvent.preventDefault)
             .addListener(link, 'click', this.locate , this);

        return this._container;
    }
  });
  L.control.locator = function(map) {
    return new L.Control.Locator(map);
  };
  // ############################
  // WMTS
  // ############################
  /*
   * Copyright (c) 2008-2013 Institut National de l'information Geographique et forestiere France, released under the
   * BSD license.
   */
  L.TileLayer.WMTS = L.TileLayer.extend({

          defaultWmtsParams: {
                  service: 'WMTS',
                  request: 'GetTile',
                  version: '1.0.0',
                  layer: '',
                  style: '',
                  tilematrixSet: '',
                  format: 'image/jpeg'
          },

          initialize: function (url, options) { // (String, Object)
                  this._url = url;
                  var wmtsParams = L.extend({}, this.defaultWmtsParams),
                      tileSize = options.tileSize || this.options.tileSize;
                  if (options.detectRetina && L.Browser.retina) {
                          wmtsParams.width = wmtsParams.height = tileSize * 2;
                  } else {
                          wmtsParams.width = wmtsParams.height = tileSize;
                  }
                  for (var i in options) {
                          // all keys that are not TileLayer options go to WMTS params
                          if (!this.options.hasOwnProperty(i) && i!="matrixIds") {
                                  wmtsParams[i] = options[i];
                          }
                  }
                  this.wmtsParams = wmtsParams;
                  this.matrixIds = options.matrixIds;
                  L.setOptions(this, options);
          },

          onAdd: function (map) {
                  L.TileLayer.prototype.onAdd.call(this, map);
          },

          getTileUrl: function (tilePoint, zoom) { // (Point, Number) -> String
                  var map = this._map;
                  crs = map.options.crs;
                  tileSize = this.options.tileSize;
                  nwPoint = tilePoint.multiplyBy(tileSize);
                  //+/-1 to get in tile
                  nwPoint.x+=1;
                  nwPoint.y-=1; 
                  sePoint = nwPoint.add(new L.Point(tileSize, tileSize)); 
                  nw = crs.project(map.unproject(nwPoint, zoom));
                  se = crs.project(map.unproject(sePoint, zoom));  
                  tilewidth = se.x-nw.x;
                  zoom=map.getZoom();
                  ident = this.matrixIds[zoom].identifier;
                  X0 = this.matrixIds[zoom].topLeftCorner.lng;
                  Y0 = this.matrixIds[zoom].topLeftCorner.lat;
                  tilecol=Math.floor((nw.x-X0)/tilewidth);
                  tilerow=-Math.floor((nw.y-Y0)/tilewidth);
                  url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});
                  return url + L.Util.getParamString(this.wmtsParams, url) + "&tilematrix=" + ident + "&tilerow=" + tilerow +"&tilecol=" + tilecol ;
          },

          setParams: function (params, noRedraw) {
                  L.extend(this.wmtsParams, params);
                  if (!noRedraw) {
                          this.redraw();
                  }
                  return this;
          }
  });

  L.tileLayer.wtms = function (url, options) {
          return new L.TileLayer.WMTS(url, options);
  };

  // ###################################
  // TileLayer fallback
  // Fallback to PNG if JPG is not available to allow transparency on borders
  // ###################################
  L.FallbackTileLayer = L.TileLayer.extend({

    _tileOnError: function () {
      var layer = this._layer;

      layer.fire('tileerror', {
        tile: this,
        url: this.src
      });

      var newUrl;
      if(this.src.indexOf(".jpg")>0) {
        layer._limit = true;
        newUrl = this.src.replace("jpg", "png");
      } else {
        newUrl = layer.options.errorTileUrl;
      }
      if (newUrl) {
        this.src = newUrl;
      }

      layer._tileLoaded();
      
    },

    reachLimit: function() {
      return this._limit;
    }
  });

  // ###################################
  // Ortho 44 specific geocoding & utils
  // ###################################

  var Ortho44 = {
    _callbackIndex: 0,

    // GEOCODING
    // -----------
    bindGeocode: function(form, input, map, callback) {
      L.DomEvent.addListener(form, 'submit', this._geocode, this);
      var clearRandom = function() {
        if(this.className == "random-display") {
          this.value = "";
          Ortho44.removeClass(this, "random-display");
        }
      };
      L.DomEvent.addListener(input, 'click', clearRandom, input);
      L.DomEvent.addListener(input, 'focus', clearRandom, input);
      this._map = map;
      this._input = input;
      this._callback = callback;
      Ortho44.setClass(document.getElementById('search-address'), "search-ready");
    },

    _loadElasticSearchJSONP: function (params) {
      var url = "http://elastic.makina-corpus.net/cg44/address/_search" + L.Util.getParamString(params);
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.src = url;
      document.getElementsByTagName("head")[0].appendChild(script);
      //document.getElementsByTagName("head")[0].removeChild(script);
    },

    _geocode: function (event) {
      L.DomEvent.preventDefault(event);
      var self = this;
      window._l_ortho44geocoder_namelookup = function(results) {
        if(results.hits.total == 0) {
          window._l_ortho44geocoder_fullsearch = L.Util.bind(self._callback, self);
          /* search any macth */
          self._loadElasticSearchJSONP({q: self._input.value, default_operator:"AND", callback: "_l_ortho44geocoder_fullsearch"});
        } else {
          self._callback(results);
        }
      };

      /* search name only */
      this._loadElasticSearchJSONP({
        source: JSON.stringify({
          query: {
                query_string: {
                    fields: ["nom", "type"],
                    query: this._input.value + " AND COMMUNE",
                    default_operator: "AND"
                }
            }
        }),
        callback : "_l_ortho44geocoder_namelookup"
      });
    },

    _getLabel: function(hit, mode) {
      var label = "";
      if(hit.nom) {
        label = hit.nom;
        if(hit.type && hit.type == "LIEUDIT") {
          label += " (Lieu-dit)"
          if(hit.commune) {
            label += " - <strong>" + hit.commune + "</strong>";
          }
        } else {
          label = "<strong>" + label + "</strong>";
        }
      } else {
        label = (mode == "POPUP" && hit.numero ? hit.numero + ' ':'') + (hit.nom_voie ? hit.nom_voie + ' - ':'') + (hit.nom_ld ? hit.nom_ld + ', ':'') + '<strong>' + (hit.commune ? hit.commune:'') + '</strong>';
      }
      return label;
    },
    showResult: function(hit) {
      var label = Ortho44._getLabel(hit, "POPUP");
      Ortho44.current_result = {"type": "Feature",
        "properties": {
            "name": label
        },
        "geometry": hit.geometry
      };
      resultsLayer.clearLayers();
      L.geoJson(Ortho44.current_result, {
        style: function (feature) {
          if(feature.geometry.type=='Polygon') return {fillColor: 'transparent'};
        },
        onEachFeature: function onEachFeature(feature, layer) {
            layer.bindPopup(feature.properties.name);
        }
      }).addTo(resultsLayer);
      var bounds = resultsLayer.getBounds();
      if (bounds.isValid()) {
        if(document.querySelector(".compare-mode")) {
          map.fitBounds(bounds, {paddingTopLeft: [-Math.round($(window).width()/2), 0]});
          L.geoJson(Ortho44.current_result, {
            style: function (feature) {
              if(feature.geometry.type=='Polygon') return {fillColor: 'transparent'};
            }
          }).addTo(Ortho44.mapcompare);
        } else {
          map.fitBounds(bounds);
        }
      }
    },

    // COMPARISON MAP
    // ---------------
    compareWith: function(map, compare_container, layer_param) {
      // clean compare map if exist
      if(Ortho44.mapcompare) Ortho44.compareClean();

      // set classes
      Ortho44.removeClass(document.getElementById(compare_container), "map-hidden");
      Ortho44.setClass(document.getElementById("map"), "map-left");
      map.invalidateSize();
      Ortho44.setClass(document.getElementById(compare_container), "map-right");
      Ortho44.setClass(document.querySelector("body"), "compare-mode");

      // create map and sync it
      Ortho44.mapcompare = L.map(compare_container,
        {
          // maxBounds: map.options.maxBounds,
          zoomControl:false,
          attribution: ''
        }
      );

      var layer = L.tileLayer(layer_param.url, layer_param.options);
      var maxZoom = layer.options.maxZoom;
      map._layersMaxZoom = maxZoom;

      layer.addTo(Ortho44.mapcompare);
      map.sync(Ortho44.mapcompare);
      Ortho44.mapcompare.sync(map);

      Ortho44.mapcompare.on('dragstart', function (e) {
        map.setMaxBounds(null);
        console.log(map.getCenter());
      });
      Ortho44.mapcompare.on('dragend', function (e) {
        map.setMaxBounds(max_bounds);
      });


      // re-center on the left
      //map.fitBounds(map.getBounds(), {paddingTopLeft: [-Math.round($(window).width()/2), 0]});

      // display search result if any
      // if(Ortho44.current_result) {
      //   L.geoJson(Ortho44.current_result, {
      //     style: function (feature) {
      //       if(feature.geometry.type=='Polygon') return {fillColor: 'transparent'};
      //     }
      //   }).addTo(Ortho44.mapcompare);
      // }

      // display position markers
      Ortho44.cursorl = L.circleMarker([0,0], {radius:20, fillOpacity: 0.2, color: '#b1ca00', fillColor: '#fff'}).addTo(map);
      Ortho44.cursorr = L.circleMarker([0,0], {radius:20, fillOpacity: 0.2, color: '#b1ca00', fillColor: '#fff'}).addTo(Ortho44.mapcompare);
      map.on('mousemove', function (e) {
        Ortho44.cursorl.setLatLng(e.latlng);
        Ortho44.cursorr.setLatLng(e.latlng);
      });
      Ortho44.mapcompare.on('mousemove', function (e) {
        Ortho44.cursorl.setLatLng(e.latlng);
        Ortho44.cursorr.setLatLng(e.latlng);
      });
    },

    compareOff: function(map) {
      if(Ortho44.mapcompare) {
        // reset classes
        Ortho44.setClass(Ortho44.mapcompare._container, "map-hidden");
        Ortho44.removeClass(document.getElementById("map"), "map-left");
        map.invalidateSize();
        Ortho44.removeClass(Ortho44.mapcompare._container, "map-right");
        Ortho44.removeClass(document.querySelector("body"), "compare-mode");

        // clean compare map
        Ortho44.compareClean();

        // reset main map
        map.off('mousemove zoom');
        map._layersMaxZoom = 19;
      }
    },
    compareClean: function() {
      map.unsync(Ortho44.mapcompare);
      Ortho44.mapcompare.unsync(map);
      //map.fitBounds(map.getBounds(), {paddingTopLeft: [Math.round($(window).width()/2), 0]});
      var parent = Ortho44.mapcompare._container.parentNode;
      console.log(Ortho44.mapcompare._container.parentNode);
      parent.removeChild(Ortho44.mapcompare._container);
      var newMapContainer = document.createElement('div');
      newMapContainer.setAttribute('id', "map-compare");
      newMapContainer.setAttribute('class', "map-hidden");
      parent.insertBefore(newMapContainer, map._container.nextSibling);
      map.removeLayer(Ortho44.cursorl);
      delete Ortho44.cursorr;
      delete Ortho44.mapcompare;
    },

    // UTILS
    // -----------
    setClass: function (element, cl) {
      var classes = element.className,
          pattern = new RegExp( cl );
          hasClass = pattern.test( classes );
      classes = hasClass ? classes : classes + ' ' + cl;
      element.className = classes.trim()
    },
    removeClass: function (element, cl) {
      var classes = element.className,
          pattern = new RegExp( cl );
          hasClass = pattern.test( classes );
      classes = hasClass ? classes.replace( pattern, '' ) : classes;
      element.className = classes.trim()
    },

    fadeOut: function(selector, interval, callback) {
      document.querySelector(selector).style.display="block";
      var opacity = 9;

      function func() {
          document.querySelector(selector).style.opacity = "0." + opacity;
          opacity--;

          if (opacity == -1) {
            window.clearInterval(fading);
            document.querySelector(selector).style.display="none";
            if(callback) callback();
          }
      }

      var fading = window.setInterval(func, interval);
    },

    randomDisplay: function() {
      var niceLocations = [
        ["Toulouse", 16, 43.6, 1.45],
      ];
      var random = niceLocations[Math.floor(Math.random()*niceLocations.length)];
      map.setView([random[2], random[3]], random[1]);
      if(!location.hash) {
        document.getElementById("search-input").value = random[0];
        Ortho44.setClass(document.getElementById('search-input'), "random-display");
      }
    }

  };

  // #############
  //  MAP INIT
  // #############


  var map = L.map('map',
      {
        maxBounds: max_bounds,
        zoomControl:false
      }
    );

  map.attributionControl.setPrefix('');
  map.on('load', function() {
    var hash = new L.Hash(map);
  });
  Ortho44.randomDisplay();

  // LAYERS
  var streets_mapquest = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {
    opacity: 0.5,
    minZoom: 9,
    maxZoom: 12,
    attribution: "MapQuest / OpenStreetMap",
    subdomains: '1234'
  });

  var matrixIds3857= new Array(22);
  for (var i= 0; i<22; i++) {
      matrixIds3857[i]= {
          identifier    : "" + i,
          topLeftCorner : new L.LatLng(20037508,-20037508)
      };
  }
  
  var ign_keys = {
    'localhost': 'ymg58ktvpimfa7zyxjxyr1a5',
    'makinacorpus.github.io' : '9z9o6i52lxwch6mxt9wmwro5',
    'vuduciel.loire-atlantique.fr' :'287bdvzzjnxqhh4s0mqfto41'
  };
  var ign_key = ign_keys[location.hostname];
  var ign = new L.TileLayer.WMTS("http://wxs.ign.fr/"+ign_key+"/geoportail/wmts",
    {
      layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
      style: 'normal',
      maxZoom: 19,
      minZoom: 13,
      tilematrixSet: "PM",
      matrixIds: matrixIds3857,
      format: 'image/jpeg',
      attribution: "&copy; IGN"
    }
  );

  var referenceLayer = new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    continuousWorld: true,  // very important
    maxZoom: 19,
    attribution: "Map data &copy; OpenStreetMap contributors",
    errorTileUrl: "/assets/images/empty.png"
  }).addTo(map);

  // CONTROLS
  var osm = new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 11, attribution: "Map data &copy; OpenStreetMap contributors"});

  map.on('locationerror', function() {
    console.log("Too far away, keep default location");
  });
  var streets_custom_osm = L.tileLayer('http://{s}.tiles.cg44.makina-corpus.net/osm/{z}/{x}/{y}.png', {
    opacity: 0.8,
    maxZoom: 19,
    attribution: "Makina Corpus / OpenStreetMap",
    subdomains: 'abcdefgh'
  });
  var older_layers = {
    'carte1680': {
      url:'http://http://tilestream.makina-corpus.net/v2/toulouse1680/{z}/{x}/{y}.png', options: {
      //url:'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', options: {
      continuousWorld: true,
      minZoom: 15,
      maxZoom: 19,
      //subdomains: 'abcdefgh'
    }},
    'carte1830': {
      url:'http://tilestream.makina-corpus.net/v2/toulouse1830/{z}/{x}/{y}.png', options: {
      //url:'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', options: {
      continuousWorld: true,
      minZoom: 15,
      maxZoom: 19,
      //subdomains: 'abcdefgh'
    }},
  };

  var resultsLayer = L.featureGroup().addTo(map);

  L.DomEvent.addListener(document.getElementById("search-input"), 'keyup', function(e) {
    if(e.keyCode != 13) {
      Ortho44.removeClass(document.getElementById('search-address'), "search-no-result");
      Ortho44.removeClass(document.getElementById('search-address'), "search-success");
    }
  }, this);

  Ortho44.bindGeocode(
    document.getElementById('search-address'),
    document.getElementById("search-input"),
    map,
    function (results) {
      var choices_box = document.getElementById('choice-list');
      Ortho44.removeClass(choices_box, "show-choices");
      if(results.hits.total > 0) {
        var best = results.hits.hits[0]._source;
        if(results.hits.total==1) {
          Ortho44.showResult(best);
        } else {
          var choices = {};
          for(var i=0;i<results.hits.hits.length;i++) {
            var hit = results.hits.hits[i]._source;
            var choice_label = Ortho44._getLabel(hit, "LISTING");
            //hit.nom ? hit.nom : (hit.nom_voie ? hit.nom_voie + ', ':'') + (hit.nom_ld ? hit.nom_ld + ', ':'') + '<strong>' + hit.commune + "</strong>";
            choices[choice_label] = hit;
          }

          choices_box.innerHTML = "";
          distinct = [];
          for(var choice in choices) {
            distinct.push(choice);
            var li = document.createElement("li");
            li.innerHTML = choice;
            L.DomEvent.addListener(li, 'click', (function(label, hit) {
              return function(){
                document.getElementById("search-input").value = label;
                Ortho44.removeClass(choices_box, "show-choices");
                Ortho44.showResult(hit);
              }
            }(li.textContent, choices[choice])));
            choices_box.appendChild(li);
          }
          if(distinct.length == 1) {
            Ortho44.showResult(best);
          } else {
            Ortho44.setClass(choices_box, "show-choices");
          }
        }
        Ortho44.setClass(document.getElementById('search-address'), "search-success");
        Ortho44.removeClass(document.getElementById('search-address'), "search-no-result");
      } else {
        resultsLayer.clearLayers();
        Ortho44.setClass(document.getElementById('search-address'), "search-no-result");
        Ortho44.removeClass(document.getElementById('search-address'), "search-success");
        choices_box.innerHTML = "";
        var p = document.createElement("p");
        p.textContent = "Aucun résultat trouvé.";
        choices_box.appendChild(p);
        Ortho44.setClass(choices_box, "show-choices");
      }
    });

  // LOCALITY SEARCH
  window._l_ortho44geocoder_localitysearch = function(results) {
    Ortho44.showResult(results.hits.hits[0]._source);
  };
  
  // SECONDARY MAP
  $("form#compare-with").on('change', function(e) {
    if(e.target.checked) {
      Ortho44.compareWith(map, "map-compare", older_layers["carte"+e.target.value]);
      var inputs = document.querySelectorAll("form#compare-with input");
      for(var i=0; i<inputs.length; i++) {
        if(inputs[i].id != e.target.id) inputs[i].checked = false;
      }
    } else {
      Ortho44.compareOff(map);
      var inputs = document.querySelectorAll("form#compare-with input");
      for(var i=0; i<inputs.length; i++) {
        inputs[i].checked = false;
      }
    }
  });
  
  // FOUNDATION INIT
  $(document).foundation(null, null, null, null, true);
  $(document).foundation('dropdown', 'off');
  $("nav li a").each(function(i, el) {
    $(el).click(function(event) {
      $('#secondary-page-zone').html="Chargement";
      $('#secondary-page-reveal').foundation('reveal', 'open');
      $('#secondary-page-zone').load(this.href + ' #wrapper');
      event.preventDefault ? event.preventDefault() : event.returnValue = false;
      return false;
    })
  });

}
