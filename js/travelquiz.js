(function() {

	// --------------------------
	// Constructor Section
	function MapTrouveTout() {
		
		// enforce use of 'new'
		if (!(this instanceof MapTrouveTout)) {
			return new MapTrouveTout();
		}
		return this;
	}
	// /End/ Constructor Section
	// --------------------------

	// -------------
	// PUBLIC
	MapTrouveTout.prototype = {
		"buildGame" : (function($elem) {
			pageDomHandler.init($elem);
			panoramaHandler.init(pageDomHandler.getPanorama());
			guessMapHandler.init(pageDomHandler.getMapCanvas());
		})
	};
	// /End/ PUBLIC
	// -------------

	// Expose mapTrouveTout as a library in general context
	window.mapTrouveTout = MapTrouveTout();

	// Expose MapTrouveTout as a "nameSpace"
	
	// --------------
	// PRIVATE
	// /End/ PRIVATE
	// -------------

	function PageDomHandler() {
		var self = this;

		var $playingGeneralArea;
		var $panoramaNode;
		var $guessPaneNode;
		var $goGuessNode;
		var $guessMapNode;
		var $showResultMapWrapper;
		var $showResultMapNode;
		var $showResultDistanceNode;
		var $continueNode;

		this.init = (function($elem) { // $elem : pageDomHandler.getPanorama()

			buildNodes($elem);

			linkNodes();

			interactionSetup();
		});

		self.getPanorama = (function() {
			return $panoramaNode;
		});
		self.getMapCanvas = (function() {
			return $guessMapNode;
		});

		self.getResultMap = (function() {
			return $showResultMapNode;
		});
		self.getResultWrapper = (function() {
			return $showResultMapWrapper;
		});

		self.getResultLabel = (function() {
			return $showResultDistanceNode;
		});

		function makeClassedNode(type, text, clazz) {
			var $node = jQuery("<" + type + ">" + text + "</" + type + ">");
			$node.addClass(clazz);
			return $node;
		}

		function buildNodes($elem) {
			$playingGeneralArea = $elem;

			$playingGeneralArea.addClass("mapTrouveTout");

			$panoramaNode = makeClassedNode("div", "", "panorama");
			$panoramaNode.addClass("full");

			$guessPaneWrapper = makeClassedNode("div", "", "guess-pane-wrapper");

			$guessPaneTirette = makeClassedNode("div", "Hide / Show", "tirette");

			$guessPaneNode = makeClassedNode("div", "", "guess-pane");
			$guessPaneNode.addClass("full");


			$goGuessNode = makeClassedNode("div", "Make a guess", "go-guess");
			$goGuessNode.addClass("button").addClass("swimmer");

			$guessMapNode = makeClassedNode("div", "", "guess-map");
			$showResultMapWrapper = makeClassedNode("div", "", "result-wrapper");
			$showResultMapNode = makeClassedNode("div", "", "result-map");
			$guessMapNode.add($showResultMapNode).addClass("map").addClass(
					"full");
			$guessMapNode.addClass("full");

			$showResultDistanceNode = makeClassedNode("div", "","result-distance");
			$continueNode = makeClassedNode("div", "Continue", "result-continue");
			$showResultDistanceNode.add($continueNode).addClass("swimmer");
			$continueNode.addClass("button");
		}

		function linkNodes() {
			$playingGeneralArea.append($panoramaNode);
			$playingGeneralArea.append($guessPaneWrapper);
			$playingGeneralArea.append($showResultMapWrapper);

			$guessPaneWrapper.append($guessPaneTirette);
			$guessPaneWrapper.append($guessPaneNode);
			$guessPaneNode.append($goGuessNode);
			$guessPaneNode.append($guessMapNode);

			$showResultMapWrapper.append($showResultMapNode);
			$showResultMapWrapper.append($showResultDistanceNode);
			$showResultMapWrapper.append($continueNode);

		}


		function interactionSetup() {

			$guessPaneTirette.click(function() {
				$guessPaneNode.slideToggle();
			});

			$goGuessNode.click(resultMapHandler.init);

			$continueNode.click(function() {
			    pageDomHandler.getResultWrapper().hide();
			    panoramaHandler.reset();
			    guessMapHandler.reset();
			});
		}

	}

	var pageDomHandler = new PageDomHandler();

	function PanoramaHandler() {
		var self = this;

        var panoramaElement;
		var startPos;
		var currentIndex = 0;

		this.init = (function($elem) {
		    panoramaElement = $elem.get(0);
		    makeStartPosition();
		});


        this.reset = function(){
            makeStartPosition();
        }

		this.getSolution = (function() {
			return new google.maps.LatLng(startPos.lat(), startPos.lng());
		});

		// --------------
		// PRIVATE


        function makeStartPosition() {
            var coordList = getCoordList();

            var coord = coordList[currentIndex];
            currentIndex = (currentIndex+1) % coordList.length;

            startPos = new google.maps.LatLng(coord.lat,coord.lng);
            panoramaElement.style.backgroundImage ="url('"+coord.image+"')";
        }

        // /End/ PRIVATE
        // -------------
	}

	var panoramaHandler = new PanoramaHandler();

	function GuessMapHandler() {
		var self = this;

        // Innsbruck
		var mapStartCenterLatLng = new google.maps.LatLng(47.269500, 11.401964);
		var marker;
		var map;

		var mapOptions = {
			zoom : 4,
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			center : mapStartCenterLatLng,
			mapTypeControl : false,
			streetViewControl : false
		};

		this.init = (function($elem) { // $elem : pageDomHandler.getMapCanvas()
			map = new google.maps.Map($elem.get(0), mapOptions);

			marker = new google.maps.Marker({
				map : map,
				draggable : true,
				animation : google.maps.Animation.DROP,
				position : mapStartCenterLatLng
			});

			google.maps.event.addListener(map, 'click', function(e) {
				marker.setPosition(e.latLng);
			});

		});

		this.reset = function(){
		    map.setOptions(mapOptions);
		    marker.setPosition(mapStartCenterLatLng);

		}

		this.getGuess = (function() {
			return new google.maps.LatLng(marker.getPosition().lat(), marker
					.getPosition().lng());
		});

	}

	var guessMapHandler = new GuessMapHandler();

	function ResultMapHandler() {
		var self = this;

		this.init = (function() {

			pageDomHandler.getResultWrapper().show();

			var actualSolution = panoramaHandler.getSolution();
			var playerProposition = guessMapHandler.getGuess();

			var bounds = new google.maps.LatLngBounds();
			bounds.extend(actualSolution);
			bounds.extend(playerProposition);

			var mapOptions = {
				mapTypeId : google.maps.MapTypeId.ROADMAP,
				// center : mapStartCenterLatLng,
				mapTypeControl : false,
				streetViewControl : false
			};

			var map = new google.maps.Map(pageDomHandler.getResultMap().get(0),
					mapOptions);

			// Fit these bounds to the map
			map.fitBounds(bounds);

			var targetMarker = new google.maps.Marker({
				map : map,
				draggable : false,
				// draggable : true,
				// animation : google.maps.Animation.DROP,
				icon : 'img/markers/target.png',
				shadow : 'img/markers/target-shadow.png',
				position : actualSolution
			});
			new google.maps.Marker({
				map : map,
				draggable : false,
				position : playerProposition
			});

			var geodesicPoly;

			var geodesicOptions = {
				strokeColor : '#CC0099',
				strokeOpacity : 1.0,
				strokeWeight : 3,
				geodesic : true,
				map : map,
				path : [ actualSolution, playerProposition ]
			};
			geodesicPoly = new google.maps.Polyline(geodesicOptions);

			var dist = google.maps.geometry.spherical.computeDistanceBetween(
					actualSolution, playerProposition);

			pageDomHandler.getResultLabel().html(
					Math.floor(dist) / 1000 + " km");

			
			if(window["coordinateWizzardIncluded"]){
				coordinateWizzard(map,targetMarker);
			}
			
		});

	}

	var resultMapHandler = new ResultMapHandler();

	// /End/ PRIVATE
	// --------------

})();
