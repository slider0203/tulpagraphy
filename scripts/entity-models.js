/* File Created: June 18, 2012 hello moto*/
tg.factories.mapEntityFactory =
    (function (ko, _, $, tg) {
    	var terrains;
    	var embellishments;

    	function _getTerrains() {
    		return new MapContext().getTerrains();
    	};

    	function _getEmbellishments() {
    		return new MapContext().getEmbellishments();
    	};

    	function MapViewModel(data) {
    		var self = this;

    		if (data) {
    			data.width = {};
    			data.height = {};

    			data.width.pixelSize = +(_.max(data.tiles, function (tile) { return tile.x; }).x) + +data.tileDiameter;
    			data.height.pixelSize = +(_.max(data.tiles, function (tile) { return tile.y; }).y) + +data.tileDiameter;

    			data.width.tileCount = parseInt((+data.width.pixelSize / (.75 * +data.tileDiameter)) - (.25 / .75));
    			data.height.tileCount = parseInt((+data.height.pixelSize / +data.tileDiameter) - .5);
    		}

    		self.id = ko.observable(data.id);
    		self.name = ko.observable(data.name);
    		self.width = ko.observable(data.width);
    		self.width().tileCount = ko.observable(self.width().tileCount);
    		self.width().pixelSize = ko.observable(self.width().pixelSize);
    		self.height = ko.observable(data.height);
    		self.height().tileCount = ko.observable(self.height().tileCount);
    		self.height().pixelSize = ko.observable(self.height().pixelSize);
    		self.tileDiameter = ko.observable(data.tileDiameter);
    		self.tileTerrainChanged = ko.observable();
    		self.tileEmbellishmentChanged = ko.observable();
    		self.scaleFactor = ko.observable(1);

    		self.pointsString = ko.computed(function () {
    			var points = [{ x: 0, y: .5 }, { x: .25, y: 0 }, { x: .5, y: 0 }, { x: .75, y: 0 }, { x: 1, y: .5 }, { x: .75, y: 1 }, { x: .5, y: 1 }, { x: .25, y: 1}];
    			points = _.map(points, function (point) { return { x: point.x * +self.tileDiameter(), y: point.y * +self.tileDiameter() }; });

    			return _.reduce(points, function (memo, point) { return memo + point.x.toString() + ',' + point.y.toString() + ' '; }, '');
    		});

    		if (data.tiles) {
    			var points = self.getHexPointsForTile(self.tileDiameter());
    			data.tiles = _.map(data.tiles, function (tileData) { return self.reconstructTile(tileData, points); });
    			data.tiles = _.sortBy(data.tiles, function (tile) { return (+tile.xIndex * self.width().pixelSize()) + +tile.yIndex; });

    			self.tiles = ko.observableArray(data.tiles);
    		}
    	};

    	MapViewModel.prototype = {
    		getTileByCoordinates: function (x, y) {
    			var self = this;

    			var index = self._getIndexByIndexedCoordinates(x, y);

    			if (index !== undefined && index !== null) {
    				return self.tiles()[index];
    			}
    		},

    		getTilePointsString: function () {
    			var self = this;
    			var pointsString = '';

    			var points = self.getHexPointsForTile(self.tileDiameter());

    			for (var pointIndex in points) {
    				pointsString += points[pointIndex].x.toString() + ',' + points[pointIndex].y.toString() + ' ';
    			}

    			return pointsString;
    		},

    		// Public method for getting the points, meant to mask whether tiles are hexes or squares later on
    		getPointsForTile: function (tileDiameter) {
    			return this.getHexPointsForTile(tileDiameter);
    		},

    		getHexPointsForTile: function (tileDiameter) {
    			var self = this;
    			var points = [];

    			var segments = [0, .5, .25, 0, .5, 0, .75, 0, 1, .5, .75, 1, .5, 1, .25, 1];

    			for (var segmentIndex in segments) {
    				segments[segmentIndex] = segments[segmentIndex] * tileDiameter;
    			}

    			for (var segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 2) {
    				points.push({ x: segments[segmentIndex], y: segments[segmentIndex + 1] });
    			}

    			return points;
    		},

    		reconstructTile: function (tileData, points) {
    			var self = this;

    			if (tileData.terrainId !== undefined && tileData.terrainId !== null) {
    				tileData.terrain = self._getTerrainById(tileData.terrainId);
    			}

    			if (tileData.embellishmentId !== undefined && tileData.embellishmentId !== null) {
    				tileData.embellishment = self._getEmbellishmentById(tileData.embellishmentId);
    			}

    			if (!tileData.terrain) {
    				tileData.terrain = _getTerrains[0];
    			}

    			tileData.xIndex = tileData.x / (.75 * self.tileDiameter());
    			tileData.yIndex = parseInt(tileData.y / self.tileDiameter());
    			tileData.points = points;

    			return new TileViewModel(tileData, self);
    		},

    		getSurroundingTilesForTile: function (tile) {
    			var self = this;
    			var surroundingTiles = [];

    			for (var i = 1; i < 7; i++) {
    				var direction = self._calculateNeighboringTileDirection(i);
    				var x = self._calculateNeighboringTileX(i, tile, tile.diameter());
    				var y = self._calculateNeighboringTileY(i, tile, tile.diameter());
    				var otherTile = self.getTileByCoordinates(x, y);
    				var oppositeI = ((i + 3) % 6) + 1;

    				if (otherTile) {
    					surroundingTiles.push({
    						i: i,
    						model: otherTile,
    						direction: direction,
    						opposite: function () {
    							return surroundingTiles[oppositeI];
    						}
    					});
    				}
    			}

    			return surroundingTiles;
    		},

    		convertToData: function () {
    			var self = this;
    			var data = {};

    			data.id = self.id();
    			data.name = self.name();
    			data.tileDiameter = self.tileDiameter();

    			data.tiles = _.map(self.tiles(), function (tile) { return self.convertTileToData(tile); });

    			return data;
    		},

    		convertTileToData: function (tile) {
    			var self = this;
    			var data = {};
    			data.x = tile.x();
    			data.y = tile.y();
    			data.terrainId = tile.terrain() == null ? null : tile.terrain().id;
    			data.embellishmentId = tile.embellishment() ? tile.embellishment().id() : null;

    			return data;
    		},

    		changeTileTerrain: function (tile, terrain) {
    			tile.terrain(terrain);

    			this.tileTerrainChanged(tile);
    		},

    		changeTileEmbellishment: function (tile, embellishment) {
    			tile.embellishment(embellishment);

    			this.tileEmbellishmentChanged(tile);
    		},

    		_calculateNeighboringTileX: function (i, tile, d) {
    			var self = this,
                    adjustment,
                    xi;

    			switch (i) {
    				case 3:
    				case 5:
    					adjustment = 1;
    					break;
    				case 1:
    				case 6:
    					adjustment = 0;
    					break;
    				case 2:
    				case 4:
    					adjustment = -1;
    					break;
    				default:
    					adjustment = 0;
    			}

    			xi = tile.xIndex + adjustment;

    			if ((xi < 0) || (xi >= self.width().tileCount())) {
    				xi = null;
    			}

    			return xi;
    		},

    		_calculateNeighboringTileY: function (i, tile, d) {
    			var self = this,
                    adjustment,
                    yi,
                    isOddRow;

    			isOddRow = ((tile.xIndex) % 2);
    			switch (i) {
    				case 1:
    					adjustment = -1;
    					break;
    				case 2:
    				case 3:
    					adjustment = isOddRow ? 0 : -1;
    					break;
    				case 4:
    				case 5:
    					adjustment = isOddRow ? 1 : 0;
    					break;
    				case 6:
    					adjustment = 1;
    					break;
    				default:
    					adjustment = 0;
    					break;
    			}

    			yi = tile.yIndex + adjustment;

    			if ((yi < 0) || (yi >= self.height().tileCount())) {
    				yi = null;
    			}

    			return yi;
    		},

    		_calculateNeighboringTileDirection: function (i) {
    			var direction;
    			switch (i) {
    				case 1:
    					direction = 90;
    					break;
    				case 2:
    					direction = 150;
    					break;
    				case 3:
    					direction = 30;
    					break;
    				case 4:
    					direction = 210;
    					break;
    				case 5:
    					direction = 330;
    					break;
    				case 6:
    					direction = 270;
    					break;
    				default:
    					direction = 0;
    					break;
    			}

    			return direction;
    		},

    		_getTerrainById: function (terrainId) {
    			var foundTerrain = _.find(_getTerrains(),
                    function (t) {
                    	return t.id === terrainId;
                    });

    			return foundTerrain ? foundTerrain : _getTerrains()[0];
    		},

    		_getEmbellishmentById: function (embellishmentId) {
    			return _.find(_getEmbellishments(), function (embellishment) { return embellishment.id() == embellishmentId; });
    		},

    		_indexTiles: function () {
    			var self = this,
                    index = undefined;

    			self._indexedTiles = {};

    			_.each(self.tiles(), function (tile) {
    				index = self._getIndexForTile(tile);
    				self._indexedTiles[index] = tile;
    			});
    		},

    		_getIndexForTile: function (tile) {
    			return this._getIndexByCartesianCoordinates(tile.x(), tile.y());
    		},

    		_getIndexByIndexedCoordinates: function (x, y) {
    			return (x !== null && x !== undefined && y !== null && y !== undefined) ? (x * this.height().tileCount() + y) : null;
    		},

    		_getIndexByCartesianCoordinates: function (x, y) {
    			return x + '|' + y;
    		}
    	};

    	function TileViewModel(data, mapViewModel) {
    		var self = this;

    		self.mapViewModel = mapViewModel;
    		self._x = data.x;
    		self._y = data.y;
    		self.xIndex = data.xIndex;
    		self.yIndex = data.yIndex;
    		self.terrain = ko.observable(data.terrain ? data.terrain : _getTerrains()[0]);
    		self.embellishment = ko.observable(data.embellishment);
    		self.observers = {};
    		self.points = data.points;
    		self.layerData = {};
    	};

    	TileViewModel.prototype = {
    		x: function () {
    			return this._x;
    		},

    		y: function () {
    			return this._y;
    		},

    		diameter: function () {
    			return this.mapViewModel.tileDiameter();
    		},

    		zIndex: function () {
    			return this.terrain() ? this.terrain().baseZIndex : 0;
    		},

    		surroundingTiles: function () {
    			if (!this._surroundingTiles) {
    				this._surroundingTiles = this.mapViewModel.getSurroundingTilesForTile(this);
    			}

    			return this._surroundingTiles;
    		}
    	};

    	function MapBackgroundLayer(mapViewModel, backgroundCanvas) {
    		var self = this;

    		self.mapViewModel = mapViewModel;
    		self.canvas = backgroundCanvas;

    		for (var tileIndex in mapViewModel.tiles()) {
    			var tile = mapViewModel.tiles()[tileIndex];

    			tile.layerData.background = {};
    			tile.layerData.background.overlayImageSubscriptions = [];

    			self.drawTile(tile);
    		}

    		mapViewModel.tileTerrainChanged.subscribe(function (tile) { self.handleTerrainChanged(tile, tile.terrain()); });
    	};

    	MapBackgroundLayer.prototype = {
    		drawTile: function (tile) {
    			var self = this;

    			self.drawTerrainForTile(tile);
    			self.blendTile(tile);
    		},

    		drawTerrainForTile: function (tile) {
    			var self = this;
    			var imageNumber = (tile.x() + tile.y()) % tile.terrain().images.length;
    			if (tile.terrain().images[imageNumber].loaded()) {
    				var context = self.canvas.getContext('2d');
    				context.drawImage(tile.terrain().images[imageNumber].element, tile.x(), tile.y(), tile.diameter(), tile.diameter());
    			} else {
    				tile.layerData.background.terrainLoadedSubscription =
                        tile.terrain().images[imageNumber].loaded.subscribe(function () { self.handleTerrainLoaded(tile); });
    			}
    		},

    		blendTile: function (tile) {
    			var self = this;
    			var tilesToBlend = _.filter(tile.surroundingTiles(), function (surroundingTile) { return surroundingTile.model.zIndex() > tile.zIndex(); });

    			for (var tileIndex in tilesToBlend) {
    				var surroundingTile = tilesToBlend[tileIndex];
    				var image = surroundingTile.model.terrain().getOverlayImage(surroundingTile.direction);

    				if (image.loaded()) {
    					self.drawOverlay(tile, surroundingTile);
    				} else {
    					var sub = {};
    					sub.subscription =
                            image.loaded.subscribe(function () { self.handleOverlayImageLoad(tile, surroundingTile, sub); });
    				}
    			}
    		},

    		drawOverlay: function (tile, surroundingTile) {
    			// Assumes we already have a loaded overlay image
    			var self = this;
    			var image = surroundingTile.model.terrain().getOverlayImage(surroundingTile.direction);
    			var radius = +tile.diameter() * .5;
    			var context = self.canvas.getContext('2d');

    			context.save();
    			context.translate(tile.x() + radius, tile.y() + radius);
    			context.drawImage(image.element, -radius, -radius, tile.diameter(), tile.diameter());
    			context.restore();
    		},

    		handleOverlayImageLoad: function (tile, surroundingTile, sub) {
    			var self = this;

    			self.drawTile(tile);
    			self.unsubscribe(sub.subscription);
    		},

    		handleSurroundingTileTerrainChanged: function (tile, surroundingTile) {
    			var self = this;

    			self.drawTile(tile);
    		},

    		handleTerrainChanged: function (tile, newTerrain) {
    			var self = this;

    			self.drawTile(tile);

    			for (var tileIndex in tile.surroundingTiles()) {
    				var surroundingTile = tile.surroundingTiles()[tileIndex];

    				self.drawTile(surroundingTile.model);
    			}
    		},

    		handleTerrainLoaded: function (tile) {
    			var self = this;

    			self.unsubscribeFromTerrainLoaded(tile);
    			self.drawTile(tile);
    		},

    		unsubscribeFromTerrainLoaded: function (tile) {
    			if (tile.layerData.background.terrainLoadedSubscription) {
    				tile.layerData.background.terrainLoadedSubscription.dispose();
    				tile.layerData.background.terrainLoadedSubscription = null;
    			}
    		},

    		unsubscribe: function (sub) {
    			if (sub) {
    				sub.dispose();
    			}
    		}
    	};

    	function MapEmbellishmentLayer(mapViewModel, embellishmentCanvas) {
    		var self = this;
    		var tile;

    		self.mapViewModel = mapViewModel;
    		self.canvas = embellishmentCanvas;

    		for (var tileIndex in self.mapViewModel.tiles()) {
    			tile = self.mapViewModel.tiles()[tileIndex];

    			self.initializeTile(tile);
    		}

    		self.mapViewModel.tileEmbellishmentChanged.subscribe(function (tile) { self.handleTileEmbellishmentChanged(tile); });

    		_.each(self.mapViewModel.tiles(), function (tile) { self.refreshTile(tile); });
    	};

    	MapEmbellishmentLayer.prototype = {
    		initializeTile: function (tile) {
    			var self = this;

    			self.initializeLayerForTile(tile);
    		},

    		initializeLayerForTile: function (tile) {
    			tile.layerData.embellishment = {};
    		},

    		drawTile: function (tile, context) {
    			var self = this;

    			if (tile && tile.embellishment() && tile.embellishment().images && tile.embellishment().images.length) {
    				//Creating a repeatable 'random'
    				var imageNumber = Math.floor((tile.x() + tile.y()) / 17) % tile.embellishment().images.length;
    				if (!tile.embellishment().images[imageNumber].loaded()) {
    					tile.layerData.embellishment.imageLoadedSubscription =
                            tile.embellishment().images[imageNumber].loaded.subscribe(function () {
                            	self.handleEmbellishmentImageLoaded(this);
                            }, tile);
    				} else {
    					context = context == null ? self.canvas.getContext('2d') : context;

    					//TODO: Replace hard coded 192 with tile size
    					context.drawImage(tile.embellishment().images[imageNumber].element,
                            tile.x() - ((tile.embellishment().images[imageNumber].element.width - 192) / 2),
                            tile.y() - ((tile.embellishment().images[imageNumber].element.height - 192) / 2),
                            tile.embellishment().images[imageNumber].element.width,
                            tile.embellishment().images[imageNumber].element.height);
    				}
    			}
    		},

    		clearTile: function (tile, context) {
    			context.clearRect(tile.x(), tile.y(), tile.diameter(), tile.diameter());
    		},

    		clipContextToTile: function (context, tile) {
    			context.moveTo(tile.x() + tile.points[tile.points.length - 1].x, tile.y() + tile.points[tile.points.length - 1].y);

    			context.beginPath();

    			_.each(tile.points, function (point) {
    				context.lineTo(tile.x() + point.x, tile.y() + point.y);
    			});

    			context.closePath();

    			context.clip();
    		},

    		refreshTile: function (tile) {
    			var self = this;

    			var context = self.canvas.getContext('2d');
    			context.save();

    			self.clipContextToTile(context, tile);
    			self.clearTile(tile, context);

    			_.each(tile.surroundingTiles().slice(0, 3), function (neighboringTile) {
    				self.drawTile(neighboringTile.model, context);
    			});

    			self.drawTile(tile, context);

    			_.each(tile.surroundingTiles().slice(3), function (neighboringTile) {
    				self.drawTile(neighboringTile.model, context);
    			});

    			context.restore();
    		},

    		handleTileEmbellishmentChanged: function (tile) {
    			var self = this;

    			self.unsubscribeFromEmbellishmentImageLoaded(tile);

    			self.refreshTile(tile);

    			_.each(tile.surroundingTiles(), function (neighboringTile) {
    				self.handleNeighboringTileEmbellishmentChanged(neighboringTile.model);
    			});
    		},

    		handleNeighboringTileEmbellishmentChanged: function (tile) {
    			var self = this;

    			self.refreshTile(tile);
    		},

    		handleEmbellishmentImageLoaded: function (tile) {
    			var self = this;
    			self.unsubscribeFromEmbellishmentImageLoaded(tile);
    			self.drawTile(tile);
    		},

    		unsubscribeFromEmbellishmentImageLoaded: function (tile) {
    			if (tile.layerData.embellishment.imageLoadedSubscription) {
    				tile.layerData.embellishment.imageLoadedSubscription.dispose();
    				delete tile.layerData.embellishment.imageLoadedSubscription;
    			}
    		}
    	};

    	function Embellishment(id, name, imageDirectory, zIndex, number) {
    		var self = this;

    		self.id = ko.observable(id);
    		self.name = ko.observable(name);
    		self.imageDirectory = ko.observable(imageDirectory);
    		self.zIndex = ko.observable(zIndex);
    		self.images = [];
    		for (var i = 1; i <= number; i++) {
    			self.images.push(new MapImage(imageDirectory + i + '.png'));
    		}
    	};

    	function Terrain(id, name, imageDirectory, zIndex, number) {
    		var self = this;

    		self.id = id;
    		self.name = name;
    		self.imageDirectory = imageDirectory;
    		self.baseZIndex = zIndex;
    		self.northOverlayImage = new MapImage(imageDirectory + 'overlay-medium-n.png');
    		self.northEastOverlayImage = new MapImage(imageDirectory + 'overlay-medium-ne.png');
    		self.northWestOverlayImage = new MapImage(imageDirectory + 'overlay-medium-nw.png');
    		self.southOverlayImage = new MapImage(imageDirectory + 'overlay-medium-s.png');
    		self.southEastOverlayImage = new MapImage(imageDirectory + 'overlay-medium-se.png');
    		self.southWestOverlayImage = new MapImage(imageDirectory + 'overlay-medium-sw.png');
    		self.images = [];

    		for (var i = 1; i <= number; i++) {
    			self.images.push(new MapImage(imageDirectory + i + '.png'));
    		}
    	};

    	Terrain.prototype = {
    		getOverlayImage: function (direction) {
    			var self = this;

    			switch (direction) {
    				case 90:
    					return self.southOverlayImage;
    				case 150:
    					return self.southEastOverlayImage;
    				case 30:
    					return self.southWestOverlayImage;
    				case 210:
    					return self.northEastOverlayImage;
    				case 330:
    					return self.northWestOverlayImage;
    				case 270:
    					return self.northOverlayImage;
    				default:
    					return self.southOverlayImage;
    			}
    		}
    	};

    	function MapImage(url) {
    		var self = this;

    		self.loaded = ko.observable(false);
    		self.element = new Image();
    		self.element.src = url;

    		var onLoaded = function () { self.loaded(true); };

    		self.element.addEventListener('load', onLoaded);
    	};

    	function MapContext() {
    	};

    	MapContext.prototype = {
    		clearMaps: function () {
    			delete localStorage.maps;
    		},

    		deleteMap: function (value) {
    			var id;

    			// 0 or '0' are valid ids
    			if (value === null || value === undefined) {
    				id = null;
    			} else if (_.isObject(value) && value.id) {
    				if (_.isFunction(value.id)) {
    					id = value.id().toString();
    				} else {
    					id = value.id.toString();
    				}
    			} else {
    				id = value.toString();
    			}

    			tg.log('Deleting map with an id of: ' + id === null || id === undefined ? 'NULL!' : id.toString());

    			var maps = this.getMaps();
    			var index = _.indexOf(maps, _.find(maps, function (map) { return map.id == id; }));

    			if (index !== null && index !== undefined) {
    				maps.splice(index, 1);
    				this._saveMaps(maps);
    			}

    			return index !== null && index !== undefined;
    		},

    		getMaps: function () {
    			var self = this;
    			var maps = JSON.parse(localStorage.getItem('maps'));

    			maps = maps ? maps : [];

    			maps = _.map(maps, function (map) {
    				return self._expandMap(map);
    			});

    			return maps;
    		},

    		getMapById: function (mapId) {
    			return _.find(this.getMaps(), function (m) {
    				return m.id === mapId;
    			});
    		},

    		saveMap: function (map) {
    			var self = this;

    			if (!map.id) {
    				map.id = this.getNextMapId();
    			}

    			var maps = this.getMaps();

    			var foundMap = _.find(maps, function (m) { return m.id == map.id; });

    			if (foundMap) {
    				maps[_.indexOf(maps, foundMap)] = map;
    			} else {
    				maps.push(map);
    			}

    			maps = _.map(maps, function (map) {
    				return self._collapseMap(map);
    			});

    			self._saveMaps(maps);

    			return map;
    		},

    		getNextMapId: function () {
    			var maps = this.getMaps();

				var lastItem = _.max(maps, function (m) { return m.id; });
				var currentId = lastItem ? lastItem.id : 0;

				if (currentId == null) {
					currentId = 0;
				}

    			return +currentId + 1;
    		},

    		getVersion: function () {
    			return localStorage.version;
    		},

    		setVersion: function (version) {
    			if (!version)
    				delete localStorage.version;
    			else {
    				localStorage.version = version;
    			}
    		},

    		getTerrains: function () {
    			if (!terrains || !terrains.length) {
    				this._initializeTerrains();
    			}

    			return terrains;
    		},

    		getEmbellishments: function () {
    			if (!embellishments || !embellishments.length) {
    				this._initializeEmbellishments();
    			}

    			return embellishments;
    		},

    		_expandMap: function (data) {
    			var self = this;
    			var map = {};

    			for (var i in data) {
    				if (i == 'tiles') {
    					map[i] = _.map(data[i], function (tile) {
    						return self._expandTile(tile);
    					});
    				} else {
    					map[i] = data[i];
    				}
    			}

    			return map;
    		},

    		_expandTile: function (tileData) {
    			var tile = {};
    			tileData = tileData.split('|');

    			tile.x = +tileData[0];
    			tile.y = +tileData[1];
    			tile.terrainId = tileData[2];
    			tile.embellishmentId = tileData[3];

    			return tile;
    		},

    		_collapseMap: function (map) {
    			var self = this;
    			var data = {};

    			for (var i in map) {
    				if (i == 'tiles') {
    					data[i] = _.map(map.tiles, function (tile) {
    						return self._collapseTileStructure(tile);
    					});
    				} else {
    					data[i] = map[i];
    				}
    			}

    			return data;
    		},

    		_collapseTileStructure: function (tile) {
    			return tile.x.toString() + '|' + tile.y.toString() + '|' + tile.terrainId.toString() + '|' + (tile.embellishmentId ? tile.embellishmentId : '').toString();
    		},

    		_initializeTerrains: function () {
    			terrains = [
                    new Terrain('black', 'Black', '/images/solids/black/', 500, 1),
                    new Terrain('gray', 'Gray', '/images/solids/gray/', 500, 1),
                    new Terrain('white', 'White', '/images/solids/white/', 500, 1)
                ];
    		},

    		_initializeEmbellishments: function () {
    			embellishments = [
                    new Embellishment('', 'Clear', '/images/embellishments/clear/', 500, 1)];
    		},

    		_saveMaps: function (maps) {
    			localStorage.maps = JSON.stringify(maps);
    		}
    	};

    	function MapFactory() {
    	};

    	MapFactory.prototype = {
    		constructMapContext: function (options) {
    			return new MapContext(options);
    		},

    		constructMapViewModel: function (id) {
    			if (!id) {
    				throw { Message: 'No ID!' };
    			}

    			var context = this.constructMapContext();
    			var map = context.getMapById(id);

    			if (!map) {
    				throw { Message: 'Couldn\'t find any map with an ID of ' + id.toString() + '.' };
    			}

    			return new MapViewModel(map);
    		},

    		constructMapBackgroundLayer: function (mapViewModel, canvas) {
    			return new MapBackgroundLayer(mapViewModel, canvas);
    		},

    		constructMapEmbellishmentLayer: function (mapViewModel, canvas) {
    			return new MapEmbellishmentLayer(mapViewModel, canvas);
    		}
    	};

    	return new MapFactory();
    })(ko, _, $, tg);