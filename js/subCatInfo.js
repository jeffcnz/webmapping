//Javascript for subcatchment info web page

//Open a map container and centre in the Hawke's Bay (Tukituki Catchment) at zoom to show whole catchment
		var map = L.map('map').setView([-39.936707, 176.593835], 10); //coordinates centred on Waipawa

	//Bring in the basemap

	
	//Esri basemap and transportation overlay  may need different ones
		L.esri.basemapLayer('Imagery').addTo(map);
		L.esri.basemapLayer('ImageryTransportation').addTo(map);


		var credits = '<a href="https://hbrcwebmap.hbrc.govt.nz/arcgis/rest/services/">Data from HBRC</a>';
		//Overlay with an ESRI feature layer showing Tukituki Subcatchments.
		var ttsubcat = L.esri.featureLayer({
			//url: 'https://hbrcwebmap.hbrc.govt.nz/arcgis/rest/services/Tukituki_PC6_Maps/FeatureServer/3/',
			//url: 'https://hbrcwebmap.hbrc.govt.nz/arcgis/rest/services/Tukituki_PC6_Maps/MapServer/3/',
			//url: 'https://hbrcwebmap.hbrc.govt.nz/arcgis/rest/services/Regional_Planning/Tukituki_River_Sub_Catchments/MapServer/0/',
			url: 'https://hbmaps.hbrc.govt.nz/arcgis/rest/services/WebMaps/TukitukiPlanChange/MapServer/3/',
			style : style, //function setting the styling for the layer
			//onEachFeature: onEachFeature //the function to call when a feature is interacted with
			}).addTo(map);
		//Add attribution for the feature layer
		map.attributionControl.addAttribution(credits);	
	//Feature Layer Style Function
	function style(feature) {
    return {
        fillColor: '#ffff99',
        weight: 2,
        opacity: 1,
        color: '#7fc97f',
        dashArray: '3',
        fillOpacity: 0.3
    };
}

	map.on('click', function (e) {pointQuery(e.latlng, 'The point you clicked');});		
	//Feature layer listner function
	function onEachFeature(feature, layer) {
		layer.on({
			//mouseover: highlightFeature,
			//mouseout: resetHighlight,
			//click: infoFeature
			});
		}
		
	//Function to update the information panel
	function infoFeature(e) {
		//console.log(e.latlng);//for debugging
		//if (map.hasLayer(results)) map.removeLayer(results);
		results.clearLayers();//clears any marker from a geolocation search off the map
		//tt.setStyle({fillColor: '#43a2ca'});//reset all features to default colour
		//tt.setFeatureStyle(e.target.feature.id, {fillColor: '#ff0000'});//highlight selected feature
		info.update(e.target.feature.properties, e.latlng);//Update the information panel
		}

	//Create the information panel and add info to it
	var info = L.control.sidebar('info', {
    position: 'right'
});
	map.addControl(info);
	//info.onAdd = function (map) {
	//	this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
	//	this.update();
	//	return this._div;
	//	};

	// method that updates the control based on feature properties passed.
	info.update = function (props, extrastr) {
		//extrastr = extrastr || "";
		//console.log(props);
		if (typeof extrastr === 'undefined') extrastr = ''; //checks if a second variable has been passed
		if (typeof props !== 'object'){ //Checks if props is an object, if not then triggers a not in Tukituki message.
			info.setContent('<br /><br />' + locationInfo(extrastr) + ' does not appear to be in the Tukituki Catchment');
			info.show();
			} 
			else
			{
		var extra = {};
		//checks sub cat info for additional information.
		for (var i in subCatInfo) {
			//console.log(subCatInfo[i].Name +" "+ props.Name);
			if (subCatInfo[i].Name == props.Name) {
				extra=subCatInfo[i].properties//;
				//console.log(extra)
				}
			}; 
		//console.log(extra);
		info.setContent('<h4>Tukituki Information</h4>' +  
			locationInfo(extrastr) + ' is in the '+
			props.Name + ' Sub-Catchment <br />'+
			'<table>' +
			'<tr><td><b>Sub-Catchment Information: </b></td></tr>' + 
			'<tr><td>Phosphorous Prority Area: </td><td>' + extra.Priority + '</td></tr>'+
			'<tr><td>Full Stock Exclusion Required: </td><td>' + extra.StockEx + '</td></tr>'+
			'</table>'
			); 
			info.show();
		};
		};

	function locationInfo(infostr) {
		return infostr;
		}
	
	//Helper function that checks there is a value, if undefined or null then replaces with a blank
	function checkDefined(property) {
		if (property) {return property} else {return ' '};
		}
		


	//Geocoding and search control
		//Define the location geocoding service, from esri, limited to New Zealand
		var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider({
			countries: ['NZL',],
			categories: ['Address', 'Postal', 'Populated Place', ]
			});
		
		

		// create the geocoding control and add it to the map
		var locationSearch = L.esri.Geocoding.geosearch({
			providers: [arcgisOnline],
			position: 'topright',
			zoomToResult: true,
			useMapBounds: false,
			placeholder: 'Search for Addresses' 
			}).addTo(map);
		//create a loading icon ready to display when content is loading
		var loading = L.control();
		
		loading.onAdd = function (map) {
			this._div = L.DomUtil.create('div', 'loadicon');
			this._div.innerHTML = '<i class="fa fa-spinner fa-2x fa-spin"></i>';
			return this._div;
			};
		
		//Create the help panel and add to the map
		var help = L.control.sidebar('help', {
			position: 'left'
			});
			
		map.addControl(help);
		
		//create control for help and position in bottom left
		var helpIcon = L.Control.extend({
			options: {position: 'bottomleft'},
			onAdd: function(map) {
				var container = L.DomUtil.create('div', 'helpIcon');
				container.innerHTML = '<i class="fa fa-question fa-2x"></i>';
				container.onclick = function(){help.toggle();}
				return container;
				},
			});
		map.addControl(new helpIcon());

		// create an empty layer group to store the results and add it to the map
		var results = L.layerGroup().addTo(map);

		// listen for the results event, add the first result to the map, and interrogate the subcatchments layer for the location and show the subcatchment info in the info panel
		locationSearch.on("results", function(data) {
			lc.stop();//stops location services, info wasn't displaying if location and search results active at same time, may need reassessed
			//results.clearLayers();
			//console.log(data.results);
			map.setZoom(15);//isn't working at moment
			//results.addLayer(L.marker(data.results[0].latlng));//adds marker at first location found
			//console.log(data.results[0].latlng);//the search text to add to the info panel if an address search is done.
			//query the subcatchment layer at the loction of the result and pass the info to the info.update function.
			//ttsubcat.query().intersects(data.results[0].latlng).run(function(error, featureCollection){
			//	if (featureCollection.features.length > 0){
			//		info.update(featureCollection.features[0].properties, data.results[0].text)
			//		} else {info.update(' ', data.results[0].text)};
			//	});
			pointQuery(data.results[0].latlng, data.results[0].text);
		
		});
			
	//Function that takes a latlng point, adds a marker, queries the subcatchment feature layer, and updates the info panel
	function pointQuery(pointObject, infoText) {
		if (typeof infoText === 'undefined') infoText = ''; //checks if a second variable has been passed
		results.clearLayers();
		results.addLayer(L.marker(pointObject));//adds marker at first location found
		loading.addTo(map);
		ttsubcat.query().intersects(pointObject).run(function(error, featureCollection){
				loading.getContainer().innerHTML='';
				if (featureCollection.features.length > 0){
					info.update(featureCollection.features[0].properties, infoText)
					} else {info.update(' ', infoText)};
				});
		}
	
		
	//Location control and handler
	lc = L.control.locate({
		follow: true,
		icon: 'fa fa-map-marker',
		keepCurrentZoomLevel: false,
		strings: {
			title: "Show me where I am"
			},
		locateOptions: {
			maxZoom :15
			}
		}).addTo(map);
	
	//Stop following if the user drags the map
	map.on('locationfound', function(e) {
		map.setZoom(15);
		pointQuery(e.latlng,'Your location')
		});
	map.on('startfollowing', function() {
		//console.log(lc);
		//pointQuery(e.latlng,'Your location');
		map.on('dragstart', lc._stopFollowing, lc);
	}).on('stopfollowing', function() {
		map.off('dragstart', lc._stopFollowing, lc);
	});

//http://jsfiddle.net/nathansnider/6askexjq/ has example and code for linking data to features.


