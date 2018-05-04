/* File Created: September 17, 2012 */
tg.factories.pageModelFactory =
(function (tg, $, _, ko) {
	/// Global Helpers
	function _getNewMapContext() {
		return tg.factories.mapEntityFactory.constructMapContext();
	};

	/// View Models
	function CreateMapViewModel() {
		var self = this;

		var terrains = _getNewMapContext().getTerrains();
		var embellishments = _getNewMapContext().getEmbellishments();

		self.terrains = _.sortBy(terrains, function (terrain) {
			return terrain.name;
		});

		self.defaultTerrain = ko.observable(_.find(terrains, function (terrain) {
			return terrain.name == 'Black';
		}));

		self.embellishments = _.sortBy(
			_.filter(embellishments, function (embellishment) {
				return embellishment.name() != "Clear" && !embellishment.name().match(/wall/gi);
			}), function (embellishment) {
				return embellishment.name();
			});

		self.defaultEmbellishment = ko.observable(null);
		self.title = ko.observable(self.generateNewDefaultTitle());
		self.tileDiameter = ko.observable(192);

		self.width = {
			tileCount: ko.observable(40),
			min: 1,
			max: 100
		};

		self.height = {
			tileCount: ko.observable(40),
			min: 1,
			max: 100
		};
	};

	CreateMapViewModel.prototype = {
		create: function () {
			try {
				var map = this.generateMap();
				var context = _getNewMapContext();

				context.saveMap(map);
				window.location = '/views/edit?id=' + map.id;
			}
			catch (ex) {
				var message = ex.name == 'QUOTA_EXCEEDED_ERR' ? 'Not enough room left to save this map :(' : 'Couldn\'t save the maps';
				alert(message);
			}
		},

		generateNewDefaultTitle: function () {
			return 'untitled';
		},

		getHeightPixelSize: function () {
			var height = (+this.height.tileCount() + .5) * +this.tileDiameter();

			return height;
		},

		getWidthPixelSize: function () {
			var width = (.25 * +this.tileDiameter()) + (.75 * +this.tileDiameter() * +this.width.tileCount());

			return width;
		},

		generateMap: function () {
			var map = {};
			
			map.name = this.title();
			map.title = this.title();
			map.tileDiameter = this.tileDiameter();
			map.tiles = this.generateTiles(this.width.tileCount(), this.height.tileCount(), this.tileDiameter(), this.defaultTerrain(), this.defaultEmbellishment());

			return map;
		},

		generateTiles: function (width, height, diameter, defaultTerrain, defaultEmbellishment) {
			var self = this;
			var tiles = [];
			var terrainId = defaultTerrain ? defaultTerrain.id : null;
			var embellishmentId = defaultEmbellishment ? defaultEmbellishment.id() : null;
			var xCartesian, yCartesian;

			for (var xIndex = 0; xIndex < width; xIndex++) {
				xCartesian = .75 * diameter * xIndex;
				var isEvenRow = xIndex % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1

				for (var yIndex = 0; yIndex < height; yIndex++) {
					yCartesian = diameter * yIndex;

					if (isEvenRow) {
						yCartesian += diameter * .5;
					}

					tiles.push(self.generateTileData(xCartesian, yCartesian, terrainId, embellishmentId));
				}
			}

			return tiles;
		},

		generateTileData: function (x, y, terrainId, embellishmentId) {
			return {
				x: x,
				y: y,
				terrainId: terrainId,
				embellishmentId: embellishmentId
			};
		}
	};

	function EditMapViewModel(mapViewModel) {
		var self = this;

		self.originalModel = mapViewModel;

		self.name = mapViewModel.name;
		self.loading = ko.observable(false);
		self.loadingMessage = ko.observable('');
		self.gridOpacity = ko.observable(.7);
		self.width = mapViewModel.width;
		self.height = mapViewModel.height;
		self.tiles = mapViewModel.tiles;
		self.tileTerrainChanged = mapViewModel.tileTerrainChanged;
		self.tileEmbellishmentChanged = mapViewModel.tileEmbellishmentChanged;
		self.scaleFactor = mapViewModel.scaleFactor;

		$printImagePopup = $('.export-image-viewport');
		self.printImageModel = new PrintImageViewModel($printImagePopup, self.originalModel, $('.map.view'), $('.image-canvas')[0], { gridOpacity: this.gridOpacity });


		self.pointsString = function () {
			return self.originalModel.pointsString();
		};

		self.toolSets = ko.observableArray(self.getInitialToolSets());
		self.selectedTool = ko.observable(null);

		self.setSelectedTool = function (newSelectedTool) {
			if (self.selectedTool()) {
				self.selectedTool().selected(false);
			}
			self.selectedTool(newSelectedTool);
			newSelectedTool.selected(true);
		};

		self.applyTool = function (tile) {
			if (self.selectedTool()) {
				self.selectedTool().applyToTile(tile);
			}
		};

		self.onMouseDownOnTile = function ($tile, e) {
			var handled = false;

			if (e.which === 1) {
				var tile = self.originalModel.getTileByCoordinates(+$tile.attr('data-x'), +$tile.attr('data-y'));
				self.applyTool(tile);
				handled = true;
			}

			return handled;
		};

		self.onMouseOverTile = function ($tile, e) {
			var handled = false;

			if (e.which === 1) {
				var tile = self.originalModel.getTileByCoordinates(+$tile.attr('data-x'), +$tile.attr('data-y'));
				self.applyTool(tile);
				handled = true;
			}

			return handled;
		};

		self.onScroll = function ($clip, e) {
			tg.log($clip.scrollLeft(), $clip.scrollTop(), $clip, e);
		};

		self.saveMap = function (model) {
			self.loading(true);

			setTimeout(function () {
				var context = _getNewMapContext();

				var savedMap = context.saveMap(self.originalModel.convertToData());
				self.originalModel.id(savedMap.id);
				self.originalModel.name(savedMap.name);

				self.loading(false);
			}, 300);
		};
	};

	EditMapViewModel.prototype = {
		getInitialToolSets: function () {
			var context = _getNewMapContext();
			var terrains = context.getTerrains();
			var embellishments = context.getEmbellishments();

			terrainToolSet = new ToolSet('Terrains',
					_.map(terrains, function (terrain) {
						return new TerrainTool(terrain);
					}));

			embellishmentToolSet = new ToolSet('Embellishments',
					_.map(embellishments, function (embellishment) {
						return new EmbellishmentTool(embellishment);
					}));

			return [terrainToolSet, embellishmentToolSet];
		}
	};

	function PrintImageViewModel($popup, mapViewModel, $mapContainer, destinationCanvas, definedOptions) {
		var self = this;

		var options = { gridOpacity: 1, exportImmediately: false };

		for (var i in definedOptions) options[i] = definedOptions[i];

		self.$popup = $popup;
		self.map = mapViewModel;
		self.gridOpacity = definedOptions.gridOpacity || function () { return 1; };
		self.$mapContainer = $mapContainer;
		self.destinationCanvas = destinationCanvas;
		self.filename = ko.observable(mapViewModel.name());
		self.working = ko.observable(false);

		self.aspectRatio = ko.computed(function () {
			return +self.map.height().pixelSize() / +self.map.width().pixelSize();
		});

		self.getContainedDimensions = function (containerHeight, containerWidth) {
			var ar = self.aspectRatio();
			var newWidth = +containerWidth;
			var newHeight = ar * containerWidth;

			if (newHeight > +containerHeight) {
				newWidth = +containerHeight / ar;
				newHeight = +newWidth * ar;
			}
			else {
				newWidth = +newHeight / ar;
			}

			return {
				height: parseInt(newHeight),
				width: parseInt(newWidth)
			};
		};

		self.adjustCanvasSize = function () {
			var $canvasContainer = $popup.find('.image-container');

			var dimensions = self.getContainedDimensions($canvasContainer.height(), $canvasContainer.width());

			$(self.destinationCanvas).css({ 'height': dimensions.height.toString() + 'px', 'width': dimensions.width.toString() + 'px' });
		};

		self.show = function () {
			self.$popup.fadeIn('fast', function () {
				self.adjustCanvasSize();
				self.refreshCanvas();
			});
		};

		self.hide = function () {
			self.$popup.fadeOut();
		};

		self.refreshCanvas = function () {
			if (self.working()) {
				return;
			}

			self.working(true);

			setTimeout(function () {
				try {
					var ctx = self.destinationCanvas.getContext('2d');

					ctx.fillStyle = 'white';
					ctx.fillRect(0, 0, self.map.width().pixelSize(), self.map.height().pixelSize());
					ctx.drawImage(self.$mapContainer.find("canvas.background-layer")[0], 0, 0);
					ctx.drawImage(self.$mapContainer.find("canvas.embellishment-layer")[0], 0, 0);

					ctx.strokeStyle = 'rgba(0,0,0,' + self.gridOpacity() + ')';

					_.each(self.map.tiles(), function (tile) {
						self.drawGridForTile(tile, ctx);
					});
				}
				catch (ex) {
					tg.log(ex);
					alert('Couldn\'t refresh the canvas!');
					var ctx = self.destinationCanvas.getContext('2d');
					ctx.clearRect(0, 0, self.map.width().pixelSize(), self.map.height().pixelSize());
				}
				finally {
					self.working(false);
				}
			}, 100);
		};

		self.downloadImage = function () {
			if (self.working()) {
				return;
			}

			self.working(true);

			setTimeout(function () {
				try {
					self.destinationCanvas.toBlob(function (blob) {
						saveAs(blob, self.getFullFilename());
					});
				}
				catch (ex) {
					alert('Couldn\'t download image!');
					tg.log(ex);
				}
				finally {
					self.working(false);
				}
			}, 100);
		};

		$(window).resize(function () { self.adjustCanvasSize(); });
	};

	PrintImageViewModel.prototype = {
		drawGridForTile: function (tile, context) {
			context.moveTo(+tile.x() + +tile.points[tile.points.length - 1].x, +tile.y() + +tile.points[tile.points.length - 1].y);
			context.beginPath();
			_.each(tile.points, function (point) {
				context.lineTo(+tile.x() + +point.x, +tile.y() + +point.y);
			});
			context.closePath();
			context.stroke();
		},

		getFullFilename: function () {
			return this.filename() + '.png';
		}
	};

	function MapIndexViewModel() {
		var self = this;
		var context = _getNewMapContext();

		self.validateContext(context);
		var maps = _.map(context.getMaps(), function (map) {
			return {
				id: ko.observable(map.id),
				name: ko.observable(map.name)
			};
		});

		self.clearMaps = function (map) {
			if (confirm('You really want to clear all the maps?')) {
				var context = _getNewMapContext();

				context.clearMaps();
				self.maps.removeAll();
			}
		};

		self.deleteMap = function (map) {
			self.working(true);

			try {
				var context = _getNewMapContext();

				if (context.deleteMap(map)) {
					self.maps.remove(map);
				}
			}
			catch (e) {
				alert('Couldn\'t delete the map!');
			}
			finally {
				self.working(false);
			}
		};

		self.working = ko.observable(false);
		self.maps = ko.observableArray(maps);
	};

	MapIndexViewModel.prototype = {
		validateContext: function (context) {
			if (!context.getVersion()) {
				context.clearMaps();
			}

			context.setVersion('1');
		},

		createMap: function () {
			tg.redirect('*map-create');
		}
	};

	function ToolSet(title, tools) {
		var self = this;

		self.title = ko.observable(title);
		self.tools = ko.observableArray(tools);
	}

	function EmbellishmentTool(embellishment, imageUrl) {
		var self = this;

		self.embellishment = embellishment;
		self.imageUrl = imageUrl ? imageUrl : embellishment.imageDirectory() + 'tool.png';
		self.selected = ko.observable(false);

		self.title = ko.computed(function () {
			return self.embellishment.name();
		});

		self.applyToTile = function (tile) {
			tile.mapViewModel.changeTileEmbellishment(tile, self.embellishment);
		};
	};

	function TerrainTool(terrain, imageUrl) {
		var self = this;

		self.terrain = terrain;
		self.imageUrl = imageUrl ? imageUrl : terrain.imageDirectory + 'tool.png';
		self.selected = ko.observable(false);

		self.title = ko.computed(function () {
			return self.terrain.name;
		});

		self.applyToTile = function (tile) {
			tile.mapViewModel.changeTileTerrain(tile, terrain);
		};
	};

	function MapPageModelFactory() { };

	MapPageModelFactory.prototype = {
		constructCreateMapModel: function () {
			return new CreateMapViewModel();
		},

		constructEditMapModel: function (mapViewModel) {
			return new EditMapViewModel(mapViewModel);
		},

		constructMapIndexModel: function () {
			return new MapIndexViewModel();
		},

		constructPrintMapToImageVm: function ($popup, mapViewModel, $mapContainer, destinationCanvas, definedOptions) {
			return new PrintImageViewModel($popup, mapViewModel, $mapContainer, destinationCanvas, definedOptions);
		}
	};

	return new MapPageModelFactory();
})(tg, $, _, ko);