/* File Created: September 17, 2012 */
tg.factories.pageModelFactory =
(function (tg, $, _, ko) {
	/// Global Helpers
	function _getNewMapContext() {
		return tg.factories.mapEntityFactory.constructMapContext();
	};

	function EditMapViewModel(mapViewModel) {
		var self = this;

		self.originalModel = mapViewModel;

		self.name = mapViewModel.name;
		self.loading = ko.observable(false);
		self.loadingMessage = ko.observable('');
		self.gridOpacity = ko.observable(0);
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
		constructEditMapModel: function (mapViewModel) {
			return new EditMapViewModel(mapViewModel);
		},

		constructPrintMapToImageVm: function ($popup, mapViewModel, $mapContainer, destinationCanvas, definedOptions) {
			return new PrintImageViewModel($popup, mapViewModel, $mapContainer, destinationCanvas, definedOptions);
		}
	};

	return new MapPageModelFactory();
})(tg, $, _, ko);