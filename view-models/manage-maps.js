(function() {
    var viewModel = (function (tg, _) {
        
        function _getNewMapContext() {
            return tg.factories.mapEntityFactory.constructMapContext();
        };

        function MapIndexViewModel() {
            var self = this;
            
            self.maps = _.map(_getNewMapContext().getMaps(), function (map) {
                return {
                    id: map.id,
                    name: map.name
                };
            });

            self.clearMaps = function (map) {
                if (confirm('You really want to clear all the maps?')) {
                    var context = _getNewMapContext();
                    context.clearMaps();
                    window.reload;
                }
            };

            //TODO: Fix deleting one map so it doesn't break all the maps
            self.deleteMap = function (map) {
                try {
                    var context = _getNewMapContext();
                    if (context.deleteMap(map)) {
                        window.reload;
                    }
                }
                catch (e) {
                    alert('Couldn\'t delete the map!');
                }
            };
        };
        
        MapIndexViewModel.prototype = {
            createMap: function () {
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

            //TODO: Remove map generation and provide 'blank canvas' to start dropping tiles
            generateMap: function () {
                var map = {};
                
                map.name = "untitled";
                map.tileDiameter = 300;
                map.tiles = this.generateTiles(10, 10, 300);

                return map;
            },

            generateTiles: function (width, height, diameter) {
                var self = this;
                var tiles = [];
                var xCartesian, yCartesian;

                for (var xIndex = 0; xIndex < width; xIndex++) {
                    xCartesian = .75 * diameter * xIndex;
                    var isEvenRow = xIndex % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1

                    for (var yIndex = 0; yIndex < height; yIndex++) {
                        yCartesian = diameter * .5 * yIndex;

                        if (isEvenRow) {
                            yCartesian += diameter * .5 * .5;
                        }

                        tiles.push(self.generateTileData(xCartesian, yCartesian));
                    }
                }

                return tiles;
            },

            generateTileData: function (x, y) {
                return {
                    x: x,
                    y: y,
                    terrainId: "blank",
                    embellishmentId: null
                };
            }
        };

        return new MapIndexViewModel();
    })(tg, _);

    ko.applyBindings(viewModel);
})();