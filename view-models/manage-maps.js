(function() {
    var viewModel = (function (tg) {
        function MapIndexViewModel() {
            var self = this;
            
            self.maps = tg.getMaps();

            self.clearMaps = function (map) {
                if (confirm('You really want to clear all the maps?')) {
                    tg.clearMaps();
                    location.reload(false);
                }
            };

            self.deleteMap = function (map) {
                try {
                    if (tg.deleteMap(map)) {
                        location.reload(false);
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
                    var id = tg.createNewMap();
                    window.location = '/views/edit-map?id=' + id;
                }
                catch (ex) {
                    var message = ex.name == 'QUOTA_EXCEEDED_ERR' ? 'Not enough room left to save this map :(' : 'Couldn\'t save the maps';
                    alert(message);
                }
            }
        };

        return new MapIndexViewModel();
    })(tg);

    ko.applyBindings(viewModel);
})();