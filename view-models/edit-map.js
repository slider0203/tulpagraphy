$(function () {
	function getId() {

        function getUrlParameter(name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            var results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        };
        
        var id = parseInt(getUrlParameter('id'));
		return id;
	};

	function constructBackgroundLayer(map, mapFactory) {
		mapFactory.constructMapBackgroundLayer(map, $("canvas.background-layer")[0]);
	};

	function constructEmbellishmentLayer(map, mapFactory) {
		mapFactory.constructMapEmbellishmentLayer(map, $("canvas.embellishment-layer")[0]);
	};

	function constructSelectionLayer(map, mapFactory) {
		var $selectionLayer = $('svg.selection-layer');
		var tileGroup = tg.make.svgElement('g', { class: 'active-tiles' });

		var points = map.pointsString();

		_.chain(map.tiles()).map(function (tile) {
			return tg.make.svgElement('polygon', {
				'points': points,
				'transform': 'translate(' + tile.x() + ', ' + tile.y() + ')',
				'data-x': tile.xIndex,
				'data-y': tile.yIndex
			});
		}).each(function (tile) {
			tileGroup.appendChild(tile);
		});

		$selectionLayer[0].appendChild(tileGroup);
		$selectionLayer.on('mousedown', '.active-tiles > polygon', function (e) { map.onMouseDownOnTile($(this), e); });
		$selectionLayer.on('mousemove', '.active-tiles > polygon', function (e) {
			window.tweakMouseEvent(e);
			return !map.onMouseOverTile($(this), e);
		});
		$selectionLayer[0].normalize();

		function bla() { onScaleFactorChanged(map); };

		map.scaleFactor.subscribe(bla);
	};

	// well, this is one way to do it...

	function initialize(map) {
		map.loading(true);

		map.loadingMessage('Loading background layer');
		setTimeout(function () {
			constructBackgroundLayer(map, tg.factories.mapEntityFactory);

			map.loadingMessage('Loading embellishment layer');
			setTimeout(function () {
				constructEmbellishmentLayer(map, tg.factories.mapEntityFactory);

				map.loadingMessage('Loading interaction layer');
				setTimeout(function () {
				    constructSelectionLayer(map, tg.factories.mapEntityFactory);
				    onScaleFactorChanged(map);
					editableMap.loading(false);
				}, 100);
			}, 100);
		}, 100);
	};

	function onScaleFactorChanged(map) {
		var scaleFactor = map.scaleFactor();

		$('.active-tiles').attr('transform', 'scale(' + scaleFactor + ')');
	};

	var map;

	try {
		var mapId = getId();

		if (!mapId) {
			throw { Message: 'No map to load.' };
		} else {
			map = tg.factories.mapEntityFactory.constructMapViewModel(mapId);
		}
	} catch (ex) {
		alert(ex.Message + '  Let\'s see what maps you do have.');
		tg.redirect('*map-index');
	}

	var editableMap = tg.factories.pageModelFactory.constructEditMapModel(map);
	ko.applyBindings(editableMap);

	initialize(editableMap);
});