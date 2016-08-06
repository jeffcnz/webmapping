 // Javascript for the water consents web page.
 
    //Open a map container and centre in the Hawke's Bay (Omahu Rd Expressway roundabout) at zoom 14
		var map = L.map('map').setView([-39.620363,176.816379], 14);

	//Bring in the basemap

	
	//Esri basemap and transportation overlay
		L.esri.basemapLayer('Imagery').addTo(map);
		L.esri.basemapLayer('ImageryTransportation').addTo(map);

		var currentQuery = "Status IN ('Current','S124 Expired/Exercised') and Type='Water Permit'";//SQL statement to limit results
		var featureUrl = 'https://hbrcwebmap.hbrc.govt.nz/arcgis/rest/services/ConsentCurrentWaterTakePointMetersWeb/MapServer/0/';//url of feature service
		var credits = '<a href="https://hbrcwebmap.hbrc.govt.nz/arcgis/rest/services/ConsentCurrentWaterTakePointMetersWeb/MapServer">Data from HBRC</a>'
	//Overlay with an ESRI feature layer showing water take consents, radius 10 for mobile screens so easier to hit with big fingers.
		//layer variable defined here, but populated with the esri layer after the listners so that the 
		//styling functions and reset style works (see Leaflet tutorials for info).
		var hbconsents; 
		var consentSearch;
		
		//Add attribution for the feature layer
		map.attributionControl.addAttribution(credits);

	//Geocoding and search control
		//Define the location geocoding service, from esri, limited to New Zealand
		var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider({
			countries: ['NZL',],
			categories: ['Address', 'Postal', 'Populated Place', ]
			});
		
		//Define the feature search (geocoding service), search consent number and bore number		
		var hbcons = L.esri.Geocoding.featureLayerProvider({
			url: featureUrl,
			searchFields: ['ConsentNumber', 'WellNumber'], // Search these fields for text matches
			label: 'Water Takes', // Group suggestions under this header
			formatSuggestion: function(feature){
				return feature.properties.ConsentNumber + ' - Bore ' + feature.properties.WellNumber; // format suggestions like this.
				}
			});

		
		
		
		//style function
		function style(feature) {
			return {
				radius: 10,//can use circleSize(map), but needs to be refreshed on zoom
				stroke: true,
				color: '#FFFFFF',
				weight:1,
				opacity: 0.8,
				fillColor: '#1e4959',	
				fillOpacity: 0.8
				};
			}
		
		
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
		//var searchMark = L.featureGroup().addTo(map);

		
			
	//Feature layer listner function
	function onEachFeature(feature, layer) {
		layer.on({
			//mouseover: highlightFeature,
			//mouseout: resetHighlight,
			click: infoFeature
			});
		}
	
	
		
	//create the feature layer after the event handlers so that the reset styles function works	
	hbconsents = L.esri.featureLayer({
			url: featureUrl,
			//url: 'https://hbrcwebmap.hbrc.govt.nz/arcgis/rest/services/HBRCResourceConsentsWeb/FeatureServer/0/',
			pointToLayer: function (geojson, latlng) {return L.circleMarker(latlng, 
				{}
				);},
			style: style,
			//where: currentQuery,
			onEachFeature: onEachFeature //the function to call when a feature is interacted with
			}).addTo(map);	
			
	// create the geocoding control and add it to the map
	consentSearch = L.esri.Geocoding.geosearch({
			providers: [arcgisOnline, hbcons],
			position: 'topright',
			useMapBounds: false,
			placeholder: 'Search for Consents, Bores or Addresses'
			}).addTo(map);
		
	//Function to update the information panel
	function infoFeature(e) {
		hbconsents.resetStyle();//reset all features to default colour
		hbconsents.setFeatureStyle(e.target.feature.id, {fillColor: '#ff0000'});//highlight selected feature
		featureQuery(e.target._latlng);
			}
		
		
		
	
		
	var featureInfo = {};
	var i = 0;
	
	//query the centre point of the feature, return the records and display the first one.	
	function featureQuery(pointObject) {
		loading.addTo(map);
		i = 0;
		featureInfo = {};
		hbconsents.query().nearby(pointObject, 1).where(currentQuery).run(function(error, featureCollection){
				loading.getContainer().innerHTML='';
				if (featureCollection.features.length > 0){
					featureInfo = featureCollection.features;
					info.update(featureInfo[i].properties)
				}
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
			'<tr><td><b>Consent: </td><td>' + props.ConsentNumber + '</td></b></tr>'+
			'<tr><td>Bore: </td><td>' + checkDefined(props.WellNumber) + '</td></tr>'+
			'<tr><td>Water Use: </td><td>' + props.UseDetail +'</td></tr>'+
			'<tr><td> </td><td>' + '</td></tr>'+
			'<tr><td>Recording frequency: </td><td>' + checkDefined(props.WMDRecordingFrequency) +'</td></tr>'+
			'<tr><td>Return method: </td><td>' + checkDefined(props.WaterUseReturnMethod) +'</td></tr>'+
			'<tr><td>Return frequency: </td><td>' + checkDefined(props.WaterUseReturnFrequency) +'</td></tr>'+
			'<tr><td> </td><td>' + '</td></tr></table>'+
			'<table><tr><td>Max. weekly volume </td><td class="value">' + checkDefined(props.ConsentMaxWeeklyTake) +'</td><td class="units"> m<sup>3</sup>/week</td></tr>'+
			'<tr><td>Max. 28 day volume </td><td class="value">' + checkDefined(props.ConsentMax28DayTake) +'</td><td class="units"> m<sup>3</sup>/28 days</td></tr>'+
			'<tr><td>Max. monthly volume</td><td class="value">' + checkDefined(props.ConsentMaxMonthlyTake) +'</td><td class="units"> m<sup>3</sup>/month</td></tr>'+
			'<tr><td>Max. annual volume </td><td class="value">' + checkDefined(props.ConsentMaxAnnualTake) +'</td><td class="units"> m<sup>3</sup>/year</td></tr>'+
			'<tr><td>Max. consented take rate </td><td class="value">' + checkDefined(props.ConsentMaxTakeRate) +'</td><td class="units"> l/s </td></tr>'+
			'<tr><td> </td><td>' + '</td></tr>'+
			'<tr><td><h4>Water Meter Details</h4></td><td></tr>' + 
			'<tr><td>Meter required? </td><td class="value">' + props.WaterMeterRequired + '</td></tr>'+
			'<tr><td>Meter required by </td><td class="value">' + checkDefined(props.WaterMeterRequiredDate) +'</td></tr>'+
			'<tr><td>Meter installed? </td><td class="value">' + props.WaterMeterInstalled +'</td></tr>'+
			'<tr><td>Meter installed on  </td><td class="value">' + checkDefined(props.WaterMeterInstallationDate) +'</td></tr>'+
			'<tr><td> </td></tr>'+
			'<tr><td>HBRC Meter Name </td><td class="value">' + checkDefined(props.MeterName) +'</td></tr>'+
			'<tr><td>Meter Serial Number </td><td class="value">' + checkDefined(props.SerialNo) +'</td></tr>'+
			'<tr><td>Meter verification date </td><td class="value">' + checkDefined(props.WaterMeterVerificationDate) +'</td></tr>'+
			'<tr><td>Measured error </td><td class="value">' + checkDefined(props.WaterMeterVerifyErrorPercentage) +'</td><td class="units">%</td></tr>'+
			'<tr><td>Verification Status: </td><td class="value">' + checkDefined(props.WaterMeterVerificationPassFail) +'</td></tr>'+
			'<tr><td> </td></tr>'+
			'<tr><td>Telemetry required? </td><td class="value">' + props.TelemetryRequired +'</td></tr>'+
			'<tr><td>Telemetry required by </td><td class="value">' + checkDefined(props.TelemetryRequiredDate) +'</td></tr>'+
			'<tr><td>Telemetry installed on </td><td class="value">' + checkDefined(props.TelemetryInstalledDate) +'</td></tr>'+
			'</table>'+
			'<p> </p>'+
			'<a class="button" href="http://data.hbrc.govt.nz/ConsentDocuments/'+ props.ConsentNumber +'.pdf" target="_blank">Consent Document</a>'
			
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
		var res = {};
		
	// listen for the results event and add every result to the map
		consentSearch.on("results", function(data) {
			lc.stop();//stops location services, info wasn't displaying if location and search results active at same time, may need reassessed
			results.clearLayers();//clear the results markers
			hbconsents.resetStyle();//reset the style to the default
			info.hide();//hide the sidebar info panel if it was showing
			for (var i = data.results.length - 1; i >= 0; i--) {
				results.addLayer(L.marker(data.results[i].latlng));
				};
			
				});

	
	//Stop following if the user drags the map
	map.on('startfollowing', function() {
		map.on('dragstart', lc._stopFollowing, lc);
	}).on('stopfollowing', function() {
		map.off('dragstart', lc._stopFollowing, lc);
	});

