//Javascript for the current consents web page

    //Open a map container and centre in the Hawke's Bay (Omahu Rd Expressway roundabout) at zoom 14
		var map = L.map('map').setView([-39.620363,176.816379], 14);

	//Bring in the basemap

	
	//Esri basemap and transportation overlay
		L.esri.basemapLayer('Imagery').addTo(map);
		L.esri.basemapLayer('ImageryTransportation').addTo(map);

		var currentQuery = "AuthorisationCurrentStatus IN ('Current','Expired - S.124 Protection')";//SQL statement to limit results
		//var featureUrl = 'https://hbrcwebmap.hbrc.govt.nz/arcgis/rest/services/HBRCResourceConsentsWeb/FeatureServer/0/';//url of feature service
		var featureUrl = 'https://hbmaps.hbrc.govt.nz/arcgis/rest/services/WebMaps/RegulatoryIRIS/MapServer/2/';
		var credits = '<a href="https://hbrcwebmap.hbrc.govt.nz/arcgis/rest/services/HBRCResourceConsentsWeb/FeatureServer">Data from HBRC</a>'
	//Overlay with an ESRI feature layer showing consents, radius 10 for mobile screens so easier to hit with big fingers.
		var hbconsents;
		
		//Add attribution for the feature layer
		map.attributionControl.addAttribution(credits);

	//Geocoding and search control
		//Define the location geocoding service, from esri, limited to New Zealand
		var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider({
			countries: ['NZL',],
			categories: ['Address', 'Postal', 'Populated Place', ]
			});
		
		//Define the feature search (geocoding service), search consent number		
		var hbcons = L.esri.Geocoding.featureLayerProvider({
			url: featureUrl,
			searchFields: ['AuthorisationIRISID', 'AuthorisationHistoricID'], // Search these fields for text matches
			label: 'Consents', // Group suggestions under this header
			formatSuggestion: function(feature){
				return feature.properties.AuthorisationIRISID; // format suggestions like this.
				}
			});

		// create the geocoding control and add it to the map
		var consentSearch = L.esri.Geocoding.geosearch({
			providers: [arcgisOnline, hbcons],
			position: 'topright',
			useMapBounds: false,
			placeholder: 'Search for Consents, Bores or Addresses' 
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

		// listen for the results event and add every result to the map
		consentSearch.on("results", function(data) {
			lc.stop();//stops location services, info wasn't displaying if location and search results active at same time, may need reassessed
			results.clearLayers();
			info.hide();
			for (var i = data.results.length - 1; i >= 0; i--) {
				results.addLayer(L.marker(data.results[i].latlng));
				};
			});
			
	function getColor(type) {
			return type == "Discharge Permit" ? '#8E3C03' :
					type == "Water Permit"  ? '#003A57' :
					type == "Land Use Consent"  ? '#539A06' :
								'#651A65';}
								
	function style(feature) {
			return {
				radius: 8,//can use circleSize(map), but needs to be refreshed on zoom
				stroke: true,
				color: '#FFFFFF',
				weight:1,
				opacity: 0.8,
				fillColor: getColor(feature.properties.AuthorisationActivityType),	
				fillOpacity: 0.8
			};
}
           
	function circleSize(map){
		var rad = 1;
		var zoomLevel = map.getZoom();
		if (zoomLevel > 13) {rad = 10}else if(zoomLevel >4){rad = 5};
		return rad;}
			
	//Feature layer listner function
	function onEachFeature(feature, layer) {
		layer.on({
			//mouseover: highlightFeature,
			//mouseout: resetHighlight,
			click: infoFeature
			});
		}
	
	hbconsents = L.esri.featureLayer({
			url: featureUrl,
			//url: 'https://hbrcwebmap.hbrc.govt.nz/arcgis/rest/services/HBRCResourceConsentsWeb/FeatureServer/0/',
			pointToLayer: function (geojson, latlng) {return L.circleMarker(latlng, 
				{radius: 10,
				stroke: true
				}
				);},
			style: style,
			//{color: '#FFFFFF',
				//fillColor: '#feb24c',
				//fillColor: getColor(geojson.properties.Type),
				//fillOpacity: 0.8},
			where: currentQuery,
			onEachFeature: onEachFeature //the function to call when a feature is interacted with
			}).addTo(map);
		
	//Function to update the information panel
	function infoFeature(e) {
		console.log(e.target.feature);
		hbconsents.resetStyle()//{fillColor: '#feb24c'});//reset all features to default colour
		hbconsents.setFeatureStyle(e.target.feature.id, {fillColor: '#ff0000'});//highlight selected feature
		featureQuery(e.target._latlng);
		}
		
	var featureInfo = {};
	var i = 0;
	
		
	function featureQuery(pointObject) {
		loading.addTo(map);
		i = 0;
		featureInfo = {};
		hbconsents.query().nearby(pointObject, 1).where(currentQuery).run(function(error, featureCollection){
				loading.getContainer().innerHTML='';
				if (featureCollection.features.length > 0){
					featureInfo = featureCollection.features;
					info.update(featureInfo[i].properties)
					};
				});
		}
	
	//Create the information panel and add info to it
	var info = L.control.sidebar('info', {
    position: 'right'
});
	map.addControl(info);
	
	//function to advance one record, when a button is pressed
	function forwardOne(){
		if (i<(featureInfo.length - 1)){i = i + 1}
		else {i=0};
		info.update(featureInfo[i].properties);
		}
	//function to go back one record when a button is pressed
	function backOne(){
		if (i>0){i = i - 1}
		else {i=(featureInfo.length - 1)};
		info.update(featureInfo[i].properties);
		}
	
	//helper function that checks how many records there are and if there are more than one displays buttons andinformation to aid navigation.
	function checkButtons(){
		var outstr = ''
		if (featureInfo.length > 1){outstr = '<button type = "button" name ="backButton" onclick = "backOne()"><b><</b></button>    Record ' + (i+1) + ' of ' + featureInfo.length + '   <button type = "button" id ="nextButton" onclick = "forwardOne()"><b>></b></button>'};
		return outstr;
		}
	
	// method that updates the control based on feature properties passed.
	info.update = function (props) {
		info.setContent(checkButtons() +
			'<table><tr><td><h4>Consent Details</h4></td></tr>' +  
			'<tr><td class="heading"><b>Consent: </td><td>' + props.AuthorisationIRISID + '</td></b></tr>'+
			'<tr><td class="heading">Status: </td><td>' + props.AuthorisationCurrentStatus + '</td></tr>'+
			'<tr><td class="heading">Type: </td><td>' + props.AuthorisationActivityType +'</td></tr>'+
            '<tr><td class="heading">Sub-Type: </td><td>' + props.AuthorisationActivitySubType +'</td></tr>'+
            '<tr><td class="heading">Use: </td><td>' + props.AuthPrimaryIndustry +'</td></tr>'+
            '<tr><td class="heading">Purpose: </td><td>' + props.AuthPrimaryPurpose +'</td></tr>'+
           // '<tr><td class="heading">Address: </td><td>' + props.SiteAddress +'</td></tr>'+
            '<tr><td class="heading">Legal Description: </td><td>' + props.AuthorisationLegal1 +'</td></tr>'+
            '<tr><td class="heading"> </td><td>' + props.AuthorisationLegal2 +'</td></tr>'+
            '<tr><td class="heading">Well Number: </td><td>' + props.WellNumber +'</td></tr>'+
            '<tr><td class="heading">Decision Date: </td><td>' + props.DecisionServedDate +'</td></tr>'+
            '<tr><td class="heading">Expiry Date: </td><td>' + props.ExpiryDate +'</td></tr>'+
            '<tr><td class="heading">Date Consent Ended: </td><td>' + checkDefined(props.ConsentEnded) +'</td></tr>'+
			'</table>'+
			'<p> </p>'+
			'<a class="button" href="https://consents.hbrc.govt.nz/consentdocuments/'+ props.AuthorisationIRISID +'.pdf" target="_blank">Consent Document</a>'
			); 
			info.show();
		};

	
	
	//Helper function that checks there is a value, if undefined or null then replaces with a blank
	function checkDefined(property) {
		if (property) {return property} else {return ' '};
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
			}
		}).addTo(map);
	
	//Stop following if the user drags the map
	map.on('startfollowing', function() {
		map.on('dragstart', lc._stopFollowing, lc);
	}).on('stopfollowing', function() {
		map.off('dragstart', lc._stopFollowing, lc);
	});
	
	var legend = L.control({position: 'bottomright'});

		legend.onAdd = function (map) {

		var div = L.DomUtil.create('div', 'info legend'),
			types = ["Water Permit", "Discharge Permit", "Land Use Consent", "Other"],
			labels = [];

		// loop through our density intervals and generate a label with a colored square for each interval
		for (var i = 0; i < types.length; i++) {
			div.innerHTML +=
				'<i style="background:' + getColor(types[i]) + '"></i> ' +
				types[i] +  '<br>';
		}

		return div;
		};

legend.addTo(map);
