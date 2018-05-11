tg = (function() {
    function MapViewModel(mapData) {
        var self = this;
        self.canvas = document.getElementById('map');
        self.context = self.canvas.getContext('2d');
        self.xOffset = 0;
        self.yOffset = 0;

        self.tiles = mapData.tiles;
        self.blankImage = new MapImage('/images/terrain/blank/1.png');
    }

    MapViewModel.prototype = {
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

        getTotalTiles: function() {
            var self = this;
            return { x: Math.ceil(self.canvas.width / (.75 * 300)) + 2, y : Math.ceil(self.canvas.height / 150) + 2 };
        },

        getTileOffset: function() {
            var self = this;
            return { x: Math.ceil(self.xOffset / (.75 * 300)), y: Math.ceil(self.yOffset / 150) };
        },

        redraw: function() {
            var self = this;
            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
            var bounds = self.getBounds();
            for (var xIndex = bounds.xMin; xIndex < bounds.xMax; xIndex++) {
                for (var yIndex = bounds.yMin; yIndex < bounds.yMax; yIndex++) {
                    var xCartesian = .75 * 300 * xIndex + self.xOffset;
                    var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
                    var yCartesian = 150 * yIndex + self.yOffset;

                    if (isEvenRow) {
                        yCartesian += 150 * .5;
                    }
                    self.context.drawImage(self.blankImage.element, xCartesian-150, yCartesian-75);
                }
            }
        },

        initialize: function() {
            var self = this;
            function render() {
                window.addEventListener('resize', self.resizeCanvas.bind(self), false);
                document.onkeydown = function(e) {
                    switch (e.keyCode) {
                        case 37:
                            self.xOffset -= 5;
                            self.redraw();
                            break;
                        case 38:
                            self.yOffset -= 5;
                            self.redraw();
                            break;
                        case 39:
                            self.xOffset += 5;
                            self.redraw();
                            break;
                        case 40:
                            self.yOffset += 5;
                            self.redraw();
                            break;
                    }
                };
                self.resizeCanvas();
            }

            self.blankImage.element.addEventListener('load', render)
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