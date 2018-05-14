tg = (function() {
    function TulpaEvent() {
        var self = this;
        self.button = 0;
    }

    TulpaEvent.prototype = {
        mouseDown: function(event) {
            var self = this;
            event.preventDefault();
            self.button = event.buttons;
            return false;
        },

        mouseUp: function(event) {
            var self = this;
            event.preventDefault();
            self.button = 0;
            return false;
        },

        mouseClick: function(callback, event) {
            var self = this;
            callback(event);
            event.preventDefault();
            return false;
        },

        mouseMove: function(primaryCallback, secondaryCallback, event) {
            var self = this;
            event.preventDefault();
            if (self.button == 1) {
                primaryCallback(event);
            }
            if (self.button == 2) {
                secondaryCallback(event.movementX, event.movementY);
            }
            return false;
        }
    }

    function MapViewModel(mapData) {
        var self = this;
        self.id = mapData.id;
        self.name = mapData.name;
        self.canvas = document.getElementById('map');
        self.context = self.canvas.getContext('2d');
        self.offset = {x: 0, y: 0};
        self.scale = 1;
        self.tileWidth = 300;
        self.tileHeight = 150;
        self.points = [{x: 0, y: .5}, {x: .25, y: 0}, {x: .75, y: 0}, {x: 1, y: .5}, {x: .75, y: 1}, {x: .25, y: 1}];

        self.tiles = mapData.tiles;
        self.blankImage = new MapImage('/images/terrain/blank/1.png');
        self.grassImage = new MapImage('/images/terrain/grass/1.png');
    }

    MapViewModel.prototype = {
        getTileHeight: function() {
            var self = this;
            return self.tileHeight * self.scale;
        },

        getTileWidth: function() {
            var self = this;
            return self.tileWidth * self.scale;
        },

        moveView: function(x, y) {
            var self = this;
            self.offset.x += x;
            self.offset.y += y;
            self.redraw();
        },

        resizeCanvas: function() {
            var self = this;
            self.canvas.width = window.innerWidth;
            self.canvas.height = window.innerHeight;
            self.redraw();
        },

        getBounds: function() {
            var self = this;
            let tileOffset = self.getTileOffset();
            let totalTiles = self.getTotalTiles();
            return { xMin: 0 - tileOffset.x,
                     xMax: totalTiles.x - tileOffset.x,
                     yMin: 0 - tileOffset.y,
                     yMax: totalTiles.y - tileOffset.y };
        },

        changeTile: function(event) {
            var self = this;
            var tileIndex = self.getTileIndex(event.offsetX, event.offsetY);
            var tile = self.tiles.find(tile => tile.x == tileIndex.x && tile.y == tileIndex.y);
            if (!tile) {
                self.tiles.push({x: tileIndex.x, y: tileIndex.y, t: 'grass'})
            }
            tile = {x: tileIndex.x, y: tileIndex.y, t: 'grass'};
            self.redraw();
            tg.saveMap({id: self.id, name: self.name, tiles: self.tiles})
        },

        getTileIndex: function(x, y) {
            var self = this;
            var bounds = self.getBounds();
            for (var xIndex = bounds.xMin; xIndex < bounds.xMax; xIndex++) {
                var xCartesian = self.getCartesianX(xIndex);
                if (xCartesian < x && xCartesian + self.getTileWidth() > x) {
                    for (var yIndex = bounds.yMin; yIndex < bounds.yMax; yIndex++) {
                        var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
                         var yCartesian = self.getCartesianY(yIndex, isEvenRow);
                        if (yCartesian < y && yCartesian + self.getTileHeight() > y) {
                            if (self.pointIntersects(xCartesian, yCartesian)) {
                                return {x: xIndex, y: yIndex};
                            }
                        }
                    }
                }
            }
        },

        pointIntersects: function(xCartesian, yCartesian) {
            var self = this;
            self.context.save();
            self.context.beginPath();
            for(var i = 0; i < self.points.length; i++) {
                if (i == 0) {
                    self.context.moveTo(xCartesian + self.points[i].x * self.getTileWidth(), yCartesian + self.points[i].y * self.getTileHeight());
                }
                else {
                    self.context.lineTo(xCartesian + self.points[i].x * self.getTileWidth(), yCartesian + self.points[i].y * self.getTileHeight());
                }
            }

            if (self.context.isPointInPath(event.offsetX, event.offsetY)) {
                return true;
            } else {
                return false;
            }
        },

        getTotalTiles: function() {
            var self = this;
            return { x: Math.ceil(self.canvas.width / (.75 * self.getTileWidth())) + 2, y : Math.ceil(self.canvas.height / self.getTileHeight()) + 2 };
        },

        getTileOffset: function() {
            var self = this;
            return { x: Math.ceil(self.offset.x / (.75 * self.getTileWidth())), y: Math.ceil(self.offset.y / self.getTileHeight()) };
        },

        redraw: function() {
            var self = this;
            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
            var bounds = self.getBounds();
            for (var xIndex = bounds.xMin; xIndex < bounds.xMax; xIndex++) {
                for (var yIndex = bounds.yMin; yIndex < bounds.yMax; yIndex++) {
                    var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
                    var tile = self.tiles.find(tile => tile.x == xIndex && tile.y == yIndex);
                    if (tile) {
                        self.context.drawImage(self.grassImage.element, self.getCartesianX(xIndex), self.getCartesianY(yIndex, isEvenRow),
                            self.getTileWidth(), self.getTileHeight());
                    } else {
                        self.context.drawImage(self.blankImage.element, self.getCartesianX(xIndex), self.getCartesianY(yIndex, isEvenRow),
                            self.getTileWidth(), self.getTileHeight());
                    }
                }
            }
        },

        getCartesianX: function(xIndex) {
            var self = this;
            return (.75 * self.getTileWidth() * xIndex) + self.offset.x - (self.getTileWidth() / 2);
        },
        
        getCartesianY: function(yIndex, evenRow) {
            var self = this;
            var yCartesian = (self.getTileHeight() * yIndex) + self.offset.y - (self.getTileHeight() / 2);
            yCartesian += evenRow ? (self.getTileHeight() / 2) : 0;
            return yCartesian;
        },

        initialize: function() {
            var self = this;
            var tulpaEvent = new TulpaEvent();
            function render() {
                window.addEventListener('resize', self.resizeCanvas.bind(self), false);
                self.canvas.addEventListener('mousedown', tulpaEvent.mouseDown.bind(tulpaEvent), false);
                self.canvas.addEventListener('mousemove', tulpaEvent.mouseMove.bind(tulpaEvent, self.changeTile.bind(self), self.moveView.bind(self)), false);
                self.canvas.addEventListener('mouseup', tulpaEvent.mouseUp.bind(tulpaEvent), false);
                self.canvas.addEventListener('click', tulpaEvent.mouseClick.bind(tulpaEvent, self.changeTile.bind(self)), false);
                self.canvas.addEventListener('contextmenu', function(e) {e.preventDefault();}, false);
                document.onkeydown = function(e) {
                    switch (e.keyCode) {
                        case 37:
                            self.moveView(5, 0);
                            break;
                        case 38:
                            self.moveView(0, 5);
                            break;
                        case 39:
                            self.moveView(-5, 0);
                            break;
                        case 40:
                            self.moveView(0, -5);
                            break;
                        case 109:
                            self.scale = Math.max(self.scale - .05, .3);
                            self.redraw();
                            break;
                        case 107:
                            self.scale = Math.min(self.scale + .05, 1);
                            self.redraw();
                            break;
                    }
                };
                self.resizeCanvas();
            }

            self.grassImage.element.addEventListener('load', render);
        }
    }

    function Terrain(id, name, imageDirectory, zIndex, number) {
        var self = this;

        self.id = id;
        self.name = name;
        self.imageDirectory = imageDirectory;
        self.baseZIndex = zIndex;
        self.images = [];

        for (var i = 1; i <= number; i++) {
            self.images.push(new MapImage(imageDirectory + i + '.png'));
        }
    };

    Terrain.prototype = {
    };

    function MapImage(url) {
        var self = this;

        self.loaded = false;
        self.element = new Image();
        self.element.src = url;

        var onLoaded = function () { self.loaded = true };

        self.element.addEventListener('load', onLoaded);
    };

    function Tulpagraphy() {
        var self = this;
        self.mapViewModel;
    };

    Tulpagraphy.prototype = {
        initializeMap: function(id) {
            this.mapViewModel = new MapViewModel(this.getMapById(id)).initialize();
        },

        getMaps: function () {
            var maps = [];
            
            Object.keys(localStorage).forEach(function(key) {
                maps.push(JSON.parse(localStorage.getItem(key)));
            });

            return maps;
        },

        getMapById: function (id) {
            return JSON.parse(localStorage.getItem(id));
        },

        createNewMap: function() {
            var id = this.getNextId();
            localStorage.setItem(id, JSON.stringify({id: id, name: 'untitled', tiles: []}));
            return id;
        },

        saveMap: function(data) {
            localStorage.setItem(data.id, JSON.stringify(data));
        },

        getNextId: function() {
            var id = 0;
            Object.keys(localStorage).forEach(function(key) {
                id = +key >= id ? +key + 1 : id;
            });
            return id;
        },

        deleteMap: function (id) {
            localStorage.removeItem(id);
        },

        clearMaps: function () {
            delete localStorage.maps;
        },

        getTerrains: function () {
            if (!terrains || !terrains.length) {
                this._initializeTerrains();
            }

            return terrains;
        },

        _initializeTerrains: function () {
            terrains = [
                new Terrain('black', 'Black', '/images/terrain/black/', 500, 1),
                new Terrain('blank', 'Blank', '/images/terrain/blank/', 500, 1),
                new Terrain('grass', 'Grass', '/images/terrain/grass/', 500, 1)
            ];
        }
    };
    return new Tulpagraphy();
})();