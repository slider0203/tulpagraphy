tg = (function() {
    function TulpaEvent() {
        var self = this;
        self.button = 0;
    }

    TulpaEvent.prototype = {
        mouseDown: function(primaryCallback, secondaryCallback, event) {
            var self = this;
            self.button = event.buttons;
            if (self.button == 1) {
                primaryCallback(event);
            }
            if (self.button == 2) {
                secondaryCallback(event);
            }
            event.preventDefault();
            return false;
        },
        
        mouseMove: function(primaryCallback, secondaryCallback, event) {
            var self = this;
            if (self.button == 1) {
                primaryCallback(event);
            }
            if (self.button == 2) {
                secondaryCallback(event);
            }
            event.preventDefault();
            return false;
        },

        mouseUp: function(primaryCallback, secondaryCallback, event) {
            var self = this;
            if (self.button == 1) {
                primaryCallback(event);
            }
            if (self.button == 2) {
                secondaryCallback(event);
            }
            self.button = 0;
            event.preventDefault();
            return false;
        },

        mouseClick: function(callback, event) {
            var self = this;
            callback(event);
            event.preventDefault();
            return false;
        },

        mouseRightClick: function(callback, event) {
            var self = this;
            callback(event);
            event.preventDefault();
            return false;
        }
    }

    function RoadController(roads, canvas, context) {
        var self = this;
        self.roads = roads;
        self.canvas = canvas;
        self.context = context;
        self.selectedPoint = null;
        self.selectedRoad = null;
        self.scale = 1;
        self.style = {
            curve:	{ width: 6, color: "#333" },
            cpline:	{ width: 1, color: "#C00" },
            point: { radius: 10, width: 2, color: "#900", fill: "rgba(200,200,200,0.5)", arc1: 0, arc2: 2 * Math.PI }
        }
        self.offset = {x: 0, y: 0};
    }

    RoadController.prototype = {
        getRoads: function() {
            var self = this;
            // Remove all roads that consist of a single point
            return self.roads.filter(road => road.length > 1);
        },

        setScale: function(scale) {
            var self = this;
            self.scale = scale;
        },

        clearSelectedRoad: function() {
            var self = this;
            self.selectedRoad = null;
        },

        deleteSelectedRoad: function() {
            var self = this;
            self.roads.splice(self.selectedRoad, 1);
            self.selectedRoad = null;
        },

        startRoad: function(x, y) {
            var self = this;
            self.selectedRoad = self.roads.length;
            self.roads.push([{x: (x - self.offset.x) / self.scale, y: (y - self.offset.y) / self.scale, c: false}]);
        },

        addAnchor: function(x, y) {
            var self = this;
            var controlPoint = self.calculateNewControlPointLocation(x, y, self.roads[self.selectedRoad].length - 1);
            self.roads[self.selectedRoad].push({x: controlPoint.x, y: controlPoint.y, c: true});
            self.roads[self.selectedRoad].push({x: (x - self.offset.x) / self.scale, y: (y - self.offset.y) / self.scale, c: false});
        },

        calculateNewControlPointLocation: function(x, y, index) {
            var self = this;
            var anchor = self.roads[self.selectedRoad][index];
            var cpx = (x - self.offset.x) / self.scale + (anchor.x + (self.offset.x - x) / self.scale) / 2;
            var cpy = (y - self.offset.y) / self.scale + (anchor.y + (self.offset.y - y) / self.scale) / 2;
            return {x: cpx, y: cpy};
        },

        isPointOnSelectedPath: function(x, y) {
            var self = this;
            self.drawRoad(self.roads[self.selectedRoad]);
            return self.context.isPointInStroke(x, y);
        },

        drawRoad: function(road) {
            var self = this;
            self.context.lineWidth = self.style.curve.width * self.scale;
            self.context.beginPath();
            self.context.moveTo(road[0].x * self.scale + self.offset.x, road[0].y * self.scale + self.offset.y);

            var control;
            for(var i = 1; i < road.length; i++) {
                if (road[i].c) {
                    control = road[i]
                }
                else {
                    self.context.quadraticCurveTo(control.x * self.scale + self.offset.x, control.y * self.scale + self.offset.y,
                        road[i].x * self.scale + self.offset.x, road[i].y * self.scale + self.offset.y);
                }
            }
        },

        drawRoadSegment: function(origin, control, end) {
            var self = this;
            self.context.lineWidth = self.style.curve.width * self.scale;
            self.context.beginPath();
            self.context.moveTo(origin.x * self.scale + self.offset.x, origin.y * self.scale + self.offset.y);
            self.context.quadraticCurveTo(control.x * self.scale + self.offset.x, control.y * self.scale + self.offset.y,
                end.x * self.scale + self.offset.x, end.y * self.scale + self.offset.y);
        },

        insertAnchorOnSegment: function(x, y) {
            var self = this;
            var road = self.roads[self.selectedRoad];
            for(var i = 2; i < road.length; i += 2) {
                self.drawRoadSegment(road[i - 2], road[i - 1], road[i]);

                if (self.context.isPointInStroke(x, y)) {
                    var controlPoint = self.calculateNewControlPointLocation(x, y, i - 2);
                    self.roads[self.selectedRoad].splice(i - 1, 0, {x: controlPoint.x, y: controlPoint.y, c: true});
                    self.roads[self.selectedRoad].splice(i, 0, {x: (x - self.offset.x) / self.scale, y: (y - self.offset.y) / self.scale, c: false});
                    return;
                }
            }
        },

        insertAnchor: function(x, y) {
            var self = this;
            if (self.isPointOnSelectedPath) {
                self.insertAnchorOnSegment(x, y)
            }
        },

        deleteAnchor: function() {
            var self = this;
            if (self.selectedPoint !== null) {
                self.roads[self.selectedRoad].splice(Math.max(self.selectedPoint - 1, 0), 2);
                if (self.roads[self.selectedRoad].length === 0) {
                    self.roads.splice(self.selectedRoad, 1);
                    self.selectedRoad = null;
                }
                self.selectedPoint = null;
            }
        },
        
        updateOffset: function(x, y) {
            var self = this;
            self.offset.x += x;
            self.offset.y += y;
        },

        render: function() {
            var self = this;
            if (self.roads.length > 0) {
                self.context.save();
                self.context.lineCap = "round";
                self.context.lineJoin = "round";
                self.drawRoads();
                self.drawControlLines();
                self.drawInteractionPoints();
                self.context.restore();                    
            }
        },

        drawRoads: function() {
            var self = this;
          	self.context.setLineDash([5 * self.scale, 15 * self.scale]);
            self.context.strokeStyle = self.style.curve.color;
            for (var r in self.roads) {
                self.drawRoad(self.roads[r]);
                self.context.stroke();    
            }
            self.context.setLineDash([]);
        },

        drawControlLines: function() {
            var self = this;
            if (self.selectedRoad !== null) {
                self.context.lineWidth = self.style.cpline.width;
                self.context.strokeStyle = self.style.cpline.color;
                self.context.beginPath();
                self.context.moveTo(self.roads[self.selectedRoad][0].x * self.scale + self.offset.x, self.roads[self.selectedRoad][0].y * self.scale + self.offset.y);
    
                for(var i = 1; i < self.roads[self.selectedRoad].length; i++) {
                    self.context.lineTo(self.roads[self.selectedRoad][i].x * self.scale + self.offset.x, self.roads[self.selectedRoad][i].y * self.scale + self.offset.y);
                }
    
                self.context.stroke();    
            }
        },

        drawInteractionPoints: function() {
            var self = this;
            if (self.selectedRoad !== null) {
                self.context.lineWidth = self.style.point.width;
                self.context.strokeStyle = self.style.point.color;
                self.context.fillStyle = self.style.point.fill;
                for (var p in self.roads[self.selectedRoad]) {
                    self.context.beginPath();
                    self.context.arc(self.roads[self.selectedRoad][p].x * self.scale + self.offset.x,
                        self.roads[self.selectedRoad][p].y * self.scale + self.offset.y, self.style.point.radius,
                        self.style.point.arc1, self.style.point.arc2, true);
                    self.context.fill();
                    self.context.stroke();
                }
            }
        },

        getPointInSelectedRoad: function(x, y) {
            var self = this;
            var dx;
            var dy;
            for (var p in self.roads[self.selectedRoad]) {
                dx = self.roads[self.selectedRoad][p].x * self.scale + self.offset.x - x;
                dy = self.roads[self.selectedRoad][p].y * self.scale + self.offset.y - y;
                if ((dx * dx) + (dy * dy) < self.style.point.radius * self.style.point.radius) {
                    self.selectedPoint = p;
                    return;
                }
            }
        },

        getRoadByPointInPath: function(x, y) {
            var self = this;
            for (var r in self.roads) {
                self.context.lineWidth = self.style.curve.width;
                self.drawRoad(self.roads[r]);
                if (self.context.isPointInStroke(event.x, event.y)) {
                    return r;
                }
            }
            return null;
        },

        onMouseDown: function(event, callback) {
            var self = this;
            if (self.selectedRoad !== null) {
                self.getPointInSelectedRoad(event.x, event.y);
                if (self.selectedPoint) {
                    self.canvas.style.cursor = "move";
                }
            }
            if (!self.selectedPoint) {
                var r = self.getRoadByPointInPath(event.x, event.y);
                if (r !== null) {
                    if (self.selectedRoad !== r) {
                        self.selectedRoad = r;
                    }
                    else {
                        self.clearSelectedRoad()
                    }
                }
                else if (self.selectedRoad !== null) {
                    self.addAnchor(event.x, event.y);
                }
                else {
                    self.startRoad(event.x, event.y);
                }
            }
            callback();
        },

        onMouseMove: function(event, callback) {
            var self = this;
            if (self.selectedPoint) {
                self.roads[self.selectedRoad][self.selectedPoint].x += event.movementX / self.scale;
                self.roads[self.selectedRoad][self.selectedPoint].y += event.movementY / self.scale;
                callback();
            }
        },

        onMouseUp: function(event, callback) {
            var self = this;
            self.selectedPoint = null;
            self.canvas.style.cursor = "default";
            callback();
        },

        onRightClick: function(event, callback) {
            var self = this;
            self.getPointInSelectedRoad(event.x, event.y);
            if (self.selectedPoint !== null) {
                self.deleteAnchor();
            } else {
                self.insertAnchor(event.x, event.y);
            }
            callback();
        }
    }
    
    function RiverController(rivers, canvas, context) {
        var self = this;
        self.rivers = rivers;
        self.canvas = canvas;
        self.context = context;
        self.selectedPoint = null;
        self.selectedRiver = null;
        self.scale = 1;
        self.style = {
            curve:	{ width: 6, color: "#688aa3" },
            cpline:	{ width: 1, color: "#C00" },
            point: { radius: 10, width: 2, color: "#900", fill: "rgba(200,200,200,0.5)", arc1: 0, arc2: 2 * Math.PI }
        }
        self.offset = {x: 0, y: 0};
    }

    RiverController.prototype = {
        getRivers: function() {
            var self = this;
            // Remove all rivers that consist of a single point
            return self.rivers.filter(river => river.length > 1);
        },

        setScale: function(scale) {
            var self = this;
            self.scale = scale;
        },

        clearSelectedRiver: function() {
            var self = this;
            self.selectedRiver = null;
        },

        deleteSelectedRiver: function() {
            var self = this;
            self.rivers.splice(self.selectedRiver, 1);
            self.selectedRiver = null;
        },

        startRiver: function(x, y) {
            var self = this;
            self.selectedRiver = self.rivers.length;
            self.rivers.push([{x: (x - self.offset.x) / self.scale, y: (y - self.offset.y) / self.scale, c: false}]);
        },

        addAnchor: function(x, y) {
            var self = this;
            var anchor = self.rivers[self.selectedRiver][self.rivers[self.selectedRiver].length - 1];
            self.rivers[self.selectedRiver].push({x: (anchor.x) + 50, y: (anchor.y) + 50, c: true});
            self.rivers[self.selectedRiver].push({x: (x - self.offset.x) / self.scale - 50, y: (y - self.offset.y) / self.scale - 50, c: true});
            self.rivers[self.selectedRiver].push({x: (x - self.offset.x) / self.scale, y: (y - self.offset.y) / self.scale, c: false});
        },

        isPointOnSelectedPath: function(x, y) {
            var self = this;
            self.drawRiver(self.rivers[self.selectedRiver]);
            return self.context.isPointInStroke(x, y);
        },

        drawRiver: function(river) {
            var self = this;
            self.context.lineWidth = self.style.curve.width * self.scale;
            self.context.beginPath();
            self.context.moveTo(river[0].x * self.scale + self.offset.x, river[0].y * self.scale + self.offset.y);

            var controls = [];
            for(var i = 1; i < river.length; i++) {
                if (river[i].c) {
                    controls.push(river[i]);
                }
                else {
                    self.context.bezierCurveTo(controls[0].x * self.scale + self.offset.x, controls[0].y * self.scale + self.offset.y,
                        controls[1].x * self.scale + self.offset.x, controls[1].y * self.scale + self.offset.y,
                        river[i].x * self.scale + self.offset.x, river[i].y * self.scale + self.offset.y);
                    controls = [];
                }
            }
        },

        drawRiverSegment: function(origin, control1, control2, end) {
            var self = this;
            self.context.lineWidth = self.style.curve.width * self.scale;
            self.context.beginPath();
            self.context.moveTo(origin.x * self.scale + self.offset.x, origin.y * self.scale + self.offset.y);
            self.context.bezierCurveTo(control1.x * self.scale + self.offset.x, control1.y * self.scale + self.offset.y,
                control2.x * self.scale + self.offset.x, control2.y * self.scale + self.offset.y,
                end.x * self.scale + self.offset.x, end.y * self.scale + self.offset.y);
        },

        insertAnchorOnSegment: function(x, y) {
            var self = this;
            var river = self.rivers[self.selectedRiver];
            for(var i = 3; i < river.length; i += 3) {
                self.drawRiverSegment(river[i - 3], river[i - 2], river[i - 1], river[i]);

                if (self.context.isPointInStroke(x, y)) {
                    self.rivers[self.selectedRiver].splice(i - 1, 0, {x: (x - self.offset.x) / self.scale + 50, y: (y - self.offset.y) / self.scale + 50, c: true});
                    self.rivers[self.selectedRiver].splice(i, 0, {x: (x - self.offset.x) / self.scale, y: (y - self.offset.y) / self.scale, c: false});
                    self.rivers[self.selectedRiver].splice(i + 1, 0, {x: (x - self.offset.x) / self.scale - 50, y: (y - self.offset.y) / self.scale - 50, c: true});
                    return;
                }
            }
        },

        insertAnchor: function(x, y) {
            var self = this;
            if (self.isPointOnSelectedPath) {
                self.insertAnchorOnSegment(x, y)
            }
        },

        deleteAnchor: function() {
            var self = this;
            if (self.selectedPoint !== null) {
                self.rivers[self.selectedRiver].splice(Math.max(self.selectedPoint - 1, 0), 3);
                if (self.rivers[self.selectedRiver].length === 0) {
                    self.rivers.splice(self.selectedRiver, 1);
                    self.selectedRiver = null;
                }
                self.selectedPoint = null;
            }
        },
        
        updateOffset: function(x, y) {
            var self = this;
            self.offset.x += x;
            self.offset.y += y;
        },

        render: function() {
            var self = this;
            if (self.rivers.length > 0) {
                self.context.save();
                self.context.lineCap = "round";
                self.context.lineJoin = "round";
                self.drawRivers();
                self.drawControlLines();
                self.drawInteractionPoints();
                self.context.restore();                    
            }
        },

        drawRivers: function() {
            var self = this;
            self.context.strokeStyle = self.style.curve.color;
            for (var r in self.rivers) {
                self.drawRiver(self.rivers[r]);
                self.context.stroke();    
            }
            self.context.setLineDash([]);
        },

        drawControlLines: function() {
            var self = this;
            if (self.selectedRiver !== null) {
                self.context.lineWidth = self.style.cpline.width;
                self.context.strokeStyle = self.style.cpline.color;
    
                for(var i = 3; i < self.rivers[self.selectedRiver].length; i += 3) {
                    self.context.beginPath();
                    self.context.moveTo(self.rivers[self.selectedRiver][i - 3].x * self.scale + self.offset.x, self.rivers[self.selectedRiver][i - 3].y * self.scale + self.offset.y);
                    self.context.lineTo(self.rivers[self.selectedRiver][i - 2].x * self.scale + self.offset.x, self.rivers[self.selectedRiver][i - 2].y * self.scale + self.offset.y);
                    self.context.stroke();
                    self.context.beginPath();
                    self.context.moveTo(self.rivers[self.selectedRiver][i - 1].x * self.scale + self.offset.x, self.rivers[self.selectedRiver][i - 1].y * self.scale + self.offset.y);
                    self.context.lineTo(self.rivers[self.selectedRiver][i].x * self.scale + self.offset.x, self.rivers[self.selectedRiver][i].y * self.scale + self.offset.y);
                    self.context.stroke();
                }    
            }
        },

        drawInteractionPoints: function() {
            var self = this;
            if (self.selectedRiver !== null) {
                self.context.lineWidth = self.style.point.width;
                self.context.strokeStyle = self.style.point.color;
                self.context.fillStyle = self.style.point.fill;
                for (var p in self.rivers[self.selectedRiver]) {
                    self.context.beginPath();
                    self.context.arc(self.rivers[self.selectedRiver][p].x * self.scale + self.offset.x,
                        self.rivers[self.selectedRiver][p].y * self.scale + self.offset.y, self.style.point.radius,
                        self.style.point.arc1, self.style.point.arc2, true);
                    self.context.fill();
                    self.context.stroke();
                }
            }
        },

        getPointInSelectedRiver: function(x, y) {
            var self = this;
            var dx;
            var dy;
            for (var p in self.rivers[self.selectedRiver]) {
                dx = self.rivers[self.selectedRiver][p].x * self.scale + self.offset.x - x;
                dy = self.rivers[self.selectedRiver][p].y * self.scale + self.offset.y - y;
                if ((dx * dx) + (dy * dy) < self.style.point.radius * self.style.point.radius) {
                    self.selectedPoint = p;
                    return;
                }
            }
        },

        getRiverByPointInPath: function(x, y) {
            var self = this;
            for (var r in self.rivers) {
                self.context.lineWidth = self.style.curve.width;
                self.drawRiver(self.rivers[r]);
                if (self.context.isPointInStroke(event.x, event.y)) {
                    return r;
                }
            }
            return null;
        },

        onMouseDown: function(event, callback) {
            var self = this;
            if (self.selectedRiver !== null) {
                self.getPointInSelectedRiver(event.x, event.y);
                if (self.selectedPoint) {
                    self.canvas.style.cursor = "move";
                }
            }
            if (!self.selectedPoint) {
                var r = self.getRiverByPointInPath(event.x, event.y);
                if (r !== null) {
                    if (self.selectedRiver !== r) {
                        self.selectedRiver = r;
                    }
                    else {
                        self.clearSelectedRiver()
                    }
                }
                else if (self.selectedRiver !== null) {
                    self.addAnchor(event.x, event.y);
                }
                else {
                    self.startRiver(event.x, event.y);
                }
            }
            callback();
        },

        onMouseMove: function(event, callback) {
            var self = this;
            if (self.selectedPoint) {
                self.rivers[self.selectedRiver][self.selectedPoint].x += event.movementX / self.scale;
                self.rivers[self.selectedRiver][self.selectedPoint].y += event.movementY / self.scale;
                if (!self.rivers[self.selectedRiver][self.selectedPoint].c) {
                    if (self.selectedPoint - 1 > 0) {
                        self.rivers[self.selectedRiver][+self.selectedPoint - 1].x += event.movementX / self.scale;
                        self.rivers[self.selectedRiver][+self.selectedPoint - 1].y += event.movementY / self.scale;    
                    }
                    if (+self.selectedPoint + 1 < self.rivers[self.selectedRiver].length) {
                        self.rivers[self.selectedRiver][+self.selectedPoint + 1].x += event.movementX / self.scale;
                        self.rivers[self.selectedRiver][+self.selectedPoint + 1].y += event.movementY / self.scale;   
                    }        
                }
                callback();
            }
        },

        onMouseUp: function(event, callback) {
            var self = this;
            self.selectedPoint = null;
            self.canvas.style.cursor = "default";
            callback();
        },

        onRightClick: function(event, callback) {
            var self = this;
            self.getPointInSelectedRiver(event.x, event.y);
            if (self.selectedPoint !== null) {
                self.deleteAnchor();
            } else {
                self.insertAnchor(event.x, event.y);
            }
            callback();
        }
    }

    function TerrainController(tiles, canvas, context) {
        var self = this;
        self.tiles = tiles;
        self.canvas = canvas;
        self.context = context;
        self.scale = 1;
        self.tileWidth = 300;
        self.tileHeight = 150;
        self.points = [{x: 0, y: .5}, {x: .25, y: 0}, {x: .75, y: 0}, {x: 1, y: .5}, {x: .75, y: 1}, {x: .25, y: 1}];
        self.terrain;
        self.selectedTerrain = 1;
        self.offset = {x: 0, y: 0};

        self.initialize();
    }

    TerrainController.prototype = {
        initialize: function() {
            var self = this;
            if (!self.terrain || !self.terrain.length) {
                self.terrain = [
                    new Terrain(0, 'Blank', '/images/terrain/blank/', 500, 1),
                    new Terrain(1, 'Grass', '/images/terrain/grass/', 500, 1),
                    new Terrain(2, 'Black', '/images/terrain/black/', 500, 1)
                ]
            }
        },

        terrainLoaded: function() {
            var self = this;
            var loaded = true;
            self.terrain.forEach(terrain => {
                if (!terrain.loaded()) {
                    loaded = false;
                    return;
                }
            });
            return loaded;
        },

        getTileHeight: function() {
            var self = this;
            return self.tileHeight * self.scale;
        },

        getTileWidth: function() {
            var self = this;
            return self.tileWidth * self.scale;
        },

        getTiles: function() {
            var self = this;
            return self.tiles.filter(tile => tile.t != 0);
        },

        setScale: function(scale) {
            var self = this;
            self.scale = scale;
        },

        updateOffset: function(x, y) {
            var self = this;
            self.offset.x += x;
            self.offset.y += y;
        },
        
        getTerrainById: function(id) {
            var self = this;
            return self.terrain.find(item => item.id == id);
        },

        setSelectedTerrainId: function(id) {
            var self = this;
            self.selectedTerrain = id;
        },

        getSelectedTerrainId: function() {
            var self = this;
            return self.selectedTerrain;
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

        changeTerrainTile: function(event, callback) {
            var self = this;
            var tileIndex = self.getTileIndex(event.offsetX, event.offsetY);
            var index = self.tiles.findIndex(tile => tile.x == tileIndex.x && tile.y == tileIndex.y);
            if (index > -1) {
                self.tiles[index].t = self.getSelectedTerrainId();
            } else {
                self.tiles.push({x: tileIndex.x, y: tileIndex.y, t: self.getSelectedTerrainId()})
            }
            callback();
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

        render: function() {
            var self = this;
            var bounds = self.getBounds();
            for (var xIndex = bounds.xMin; xIndex < bounds.xMax; xIndex++) {
                for (var yIndex = bounds.yMin; yIndex < bounds.yMax; yIndex++) {
                    var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
                    var tile = self.tiles.find(tile => tile.x == xIndex && tile.y == yIndex);
                    if (tile) {
                        self.context.drawImage(self.getTerrainById(tile.t).images[0].element, self.getCartesianX(xIndex), self.getCartesianY(yIndex, isEvenRow),
                            self.getTileWidth(), self.getTileHeight());
                    } else {
                        self.context.drawImage(self.getTerrainById(0).images[0].element, self.getCartesianX(xIndex), self.getCartesianY(yIndex, isEvenRow),
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
        }
    }

    function MapViewModel(mapData) {
        var self = this;
        self.id = mapData.id;
        self.name = mapData.name;
        self.canvas;
        self.context;
        self.scale = 1;
        self.activeLayer = 'terrain';
        self.terrainController;
        self.roadController;
        self.riverController;

        self.initialize(mapData.tiles, mapData.roads, mapData.rivers);
    }

    MapViewModel.prototype = {
        changeActiveLayer: function(layer) {
            var self = this;
            document.getElementById(self.activeLayer + "Layer").classList.remove('active');
            self.activeLayer = layer;
            if (self.activeLayer == 'terrain') {
                document.getElementById('toolbar').style.display = 'block';
            }
            else  {
                document.getElementById('toolbar').style.display = 'none';
            }
            self.roadController.clearSelectedRoad();
            self.riverController.clearSelectedRiver();
            self.render();
            document.getElementById(self.activeLayer + "Layer").classList.add('active');
        },

        clearSelected: function() {
            var self = this;
            if (self.activeLayer == 'road') {
                self.roadController.clearSelectedRoad();
                self.render();
            }
            if (self.activeLayer == 'river') {
                self.riverController.clearSelectedRiver();
                self.render();
            }
        },

        deleteSelected: function() {
            var self = this;
            if (self.activeLayer == 'road') {
                self.roadController.deleteSelectedRoad();
                self.mapUpdated();
            }
            if (self.activeLayer == 'river') {
                self.riverController.deleteSelectedRiver();
                self.mapUpdated();
            }
        },

        mouseDownPrimary: function(event) {
            var self = this;
            if (self.activeLayer == 'road') {
                self.roadController.onMouseDown(event, self.mapUpdated.bind(self));
            }
            if (self.activeLayer == 'river') {
                self.riverController.onMouseDown(event, self.mapUpdated.bind(self));
            }
        },

        mouseDownSecondary: function() {
        },

        mouseMovePrimary: function(event) {
            var self = this;
            if (self.activeLayer == 'terrain') {
                self.terrainController.changeTerrainTile(event, self.mapUpdated.bind(self));
            }
            if (self.activeLayer == 'road') {
                self.roadController.onMouseMove(event, self.render.bind(self));
            }
            if (self.activeLayer == 'river') {
                self.riverController.onMouseMove(event, self.render.bind(self));
            }
        },

        mouseMoveSecondary: function() {
            var self = this;
            self.moveView(event.movementX, event.movementY);
        },

        mouseUpPrimary: function(event) {
            var self = this;
            if (self.activeLayer == 'road') {
                self.roadController.onMouseUp(event, self.mapUpdated.bind(self));
            }
            if (self.activeLayer == 'river') {
                self.riverController.onMouseUp(event, self.mapUpdated.bind(self));
            }
        },

        mouseUpSecondary: function() {
        },

        mouseClickPrimary: function(event) {
            var self = this;
            if (self.activeLayer == 'terrain') {
                self.terrainController.changeTerrainTile(event, self.mapUpdated.bind(self));
            }
        },

        mouseClickSecondary: function() {
            var self = this;
            if (self.activeLayer == 'road') {
                self.roadController.onRightClick(event, self.mapUpdated.bind(self));
            }
            if (self.activeLayer == 'river') {
                self.riverController.onRightClick(event, self.mapUpdated.bind(self));
            }
        },

        moveView: function(x, y) {
            var self = this;
            self.terrainController.updateOffset(x, y);
            self.roadController.updateOffset(x, y);
            self.riverController.updateOffset(x, y);
            self.render();
        },

        resizeCanvas: function() {
            var self = this;
            self.canvas.width = window.innerWidth;
            self.canvas.height = window.innerHeight;
            self.render();
        },

        mapUpdated: function() {
            var self = this;
            self.render();
            tg.saveMap({id: self.id, name: self.name, tiles: self.terrainController.getTiles(),
                roads: self.roadController.getRoads(), rivers: self.riverController.getRivers()});
        },

        render: function() {
            var self = this;
            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
            self.terrainController.render();
            self.riverController.render();
            self.roadController.render();
        },

        zoomIn: function() {
            var self = this;
            self.scale = Math.min(self.scale + .05, 1);
            self.terrainController.setScale(self.scale);
            self.roadController.setScale(self.scale);
            self.riverController.setScale(self.scale);
            self.render();
        },

        zoomOut: function() {
            var self = this;
            self.scale = Math.max(self.scale - .05, .3);
            self.terrainController.setScale(self.scale);
            self.roadController.setScale(self.scale);
            self.riverController.setScale(self.scale);
            self.render();
        },

        bindActions: function() {
            var self = this;
            var tulpaEvent = new TulpaEvent();
            window.addEventListener('resize', self.resizeCanvas.bind(self), false);
            self.canvas.addEventListener('mousedown', tulpaEvent.mouseDown.bind(tulpaEvent, self.mouseDownPrimary.bind(self), self.mouseDownSecondary.bind(self)), false);
            self.canvas.addEventListener('mousemove', tulpaEvent.mouseMove.bind(tulpaEvent, self.mouseMovePrimary.bind(self), self.mouseMoveSecondary.bind(self)), false);
            self.canvas.addEventListener('mouseup', tulpaEvent.mouseUp.bind(tulpaEvent, self.mouseUpPrimary.bind(self), self.mouseUpSecondary.bind(self)), false);
            self.canvas.addEventListener('click', tulpaEvent.mouseClick.bind(tulpaEvent, self.mouseClickPrimary.bind(self)), false);
            self.canvas.addEventListener('contextmenu', tulpaEvent.mouseRightClick.bind(tulpaEvent, self.mouseClickSecondary.bind(self)), false);
            document.onkeydown = function(event) {
                switch (event.keyCode) {
                    case 27:
                        self.clearSelected();
                        break;
                    case 46:
                        self.deleteSelected();
                        break;
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
                        self.zoomOut();
                        break;
                    case 107:
                        self.zoomIn();
                        break;
                }
            };
        },

        initialize: function(tiles, roads, rivers) {
            var self = this;
            var tulpagraphyContainer = document.getElementById('tulpagraphy');
            self.canvas = document.createElement('canvas');
            tulpagraphyContainer.appendChild(self.canvas);
            self.context = self.canvas.getContext('2d');
            var toolbar = document.createElement('div');
            toolbar.setAttribute('id', 'toolbar');
            self.terrainController = new TerrainController(tiles, self.canvas, self.context);
            self.terrainController.terrain.forEach(function(item) {
                var tool = document.createElement('img');
                tool.setAttribute('src', item.imageDirectory + 'tool.png');
                tool.addEventListener('click', self.terrainController.setSelectedTerrainId.bind(self.terrainController, item.id));
                toolbar.appendChild(tool);
            });
            self.roadController = new RoadController(roads, self.canvas, self.context);
            self.riverController = new RiverController(rivers, self.canvas, self.context);
            tulpagraphyContainer.appendChild(toolbar);

            self.bindActions();

            document.getElementById('terrainLayer').classList.add('active');

            var loader = setInterval(function() {
                if (self.terrainController.terrainLoaded()) {
                    clearInterval(loader);
                    self.resizeCanvas();
                }
            }, 100);
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
        loaded: function() {
            var self = this;
            let loaded = true;
            self.images.forEach(function(image) {
                if (!image.loaded) {
                    loaded = false;
                    return;
                }
            });
            return loaded;
        }
    };

    function MapImage(url) {
        var self = this;

        self.loaded = false;
        self.element = new Image();
        self.element.src = url;
        self.element.addEventListener('load', self.onLoaded.bind(self));
    };

    MapImage.prototype = {
        onLoaded: function() {
            var self = this;
            self.loaded = true;
        }
    }

    function Tulpagraphy() {
        var self = this;
        self.mapViewModel;
    };

    Tulpagraphy.prototype = {
        initializeMap: function(id) {
            this.mapViewModel = new MapViewModel(this.getMapById(id));
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
            localStorage.setItem(id, JSON.stringify({id: id, name: 'untitled', tiles: [], roads: [], rivers:[]}));
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
        }
    };
    return new Tulpagraphy();
})();