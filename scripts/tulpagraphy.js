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

    function LabelController(labels, canvas, context) {
        var self = this;
        self.labels = labels;
        self.canvas = canvas;
        self.context = context;
        self.selectedLabel = null;
        self.scale = 1;
        self.offset = {x: 0, y: 0};
    }

    LabelController.prototype = {
        getLabels: function() {
            var self = this;
            // Remove all labels that consist of a single point
            return self.labels.filter(label => label.v.length > 1);
        },

        setSelectedLabel: function(selectedLabel) {
            var self = this;
            self.selectedLabel = selectedLabel;
            document.getElementById('labelToolbar').style.display = 'block';
            document.getElementById('labelText').value = self.labels[self.selectedLabel].v;
            var fontSize = document.getElementById('fontSize');
            for (var i = 0; i < fontSize.options.length; i++) {
                if (fontSize.options[i].text == self.labels[self.selectedLabel].p) {
                    fontSize.selectedIndex = i;
                    break;
                }
            }
            var fonts = document.getElementById('fonts');
            for (var i = 0; i < fonts.options.length; i++) {
                if (fonts.options[i].value == self.labels[self.selectedLabel].f) {
                    fonts.selectedIndex = i;
                    break;
                }
            }
            document.getElementById('colorPicker').value = self.labels[self.selectedLabel].c;
            document.getElementById('bold').checked = self.labels[self.selectedLabel].b;
            document.getElementById('italic').checked = self.labels[self.selectedLabel].i;
        },
        
        clearSelectedLabel: function() {
            var self = this;
            self.selectedLabel = null;
            document.getElementById('labelToolbar').style.display = 'none';
        },

        setScale: function(scale) {
            var self = this;
            self.scale = scale;
        },

        updateFontColor: function(callback, event) {
            var self = this;
            self.labels[self.selectedLabel].c = event.srcElement.value;
            callback();            
        },

        updateBold: function(callback, event) {
            var self = this;
            console.log(event);
            self.labels[self.selectedLabel].b = event.srcElement.checked;
            callback();
        },

        updateItalic: function(callback, event) {
            var self = this;
            self.labels[self.selectedLabel].i = event.srcElement.checked;
            callback();
        },

        updateFontSize: function(callback, event) {
            var self = this;
            self.labels[self.selectedLabel].p = event.srcElement.selectedOptions[0].text;
            callback();
        },

        updateFont: function(callback, event) {
            var self = this;
            self.labels[self.selectedLabel].f = event.srcElement.selectedOptions[0].value;
            callback();
        },

        updateLabelText: function(callback, event) {
            var self = this;
            self.labels[self.selectedLabel].v = event.srcElement.value;
            callback();
        },

        deleteSelectedLabel: function() {
            var self = this;
            self.labels.splice(self.selectedLabel, 1);
            self.clearSelectedLabel();
        },

        startLabel: function(x, y) {
            var self = this;
            self.labels.push({x: (x - self.offset.x) / self.scale, y: (y - self.offset.y) / self.scale, v: 'Testing', f: 'Arial', p: 32, c: '#000000', b: false, i: false});
            self.setSelectedLabel(self.labels.length - 1);
        },

        updateOffset: function(x, y) {
            var self = this;
            self.offset.x += x;
            self.offset.y += y;
        },

        render: function() {
            var self = this;
            for(var label in self.labels) {
                var font = self.labels[label].b ? "bold " : "";
                font += self.labels[label].i ? "italic " : "";
                font += self.labels[label].p * self.scale + "pt " + self.labels[label].f;
                
                self.context.font = font;
                self.context.fillStyle = self.labels[label].c;
                self.context.fillText(self.labels[label].v, self.labels[label].x * self.scale + self.offset.x, self.labels[label].y * self.scale + self.offset.y);                
            }

            if (self.selectedLabel !== null) {
                var font = self.labels[self.selectedLabel].b ? "bold " : "";
                font += self.labels[self.selectedLabel].i ? "italic " : "";
                font += self.labels[self.selectedLabel].p * self.scale + "pt " + self.labels[self.selectedLabel].f;
                
                self.context.font = font;
                var metrics = self.context.measureText(self.labels[self.selectedLabel].v);
                self.context.strokeRect(self.labels[self.selectedLabel].x * self.scale + self.offset.x - 1,
                    self.labels[self.selectedLabel].y * self.scale + self.offset.y - 1 - (self.labels[self.selectedLabel].p * self.scale),
                    metrics.width + 1, self.labels[self.selectedLabel].p * self.scale + 1);
            }
        },

        getPointInBoundingBox: function(x, y) {
            var self = this;
            self.clearSelectedLabel();
            for(var label in self.labels) {
                var font = self.labels[label].b ? "bold " : "";
                font += self.labels[label].i ? "italic " : "";
                font += self.labels[label].p * self.scale + "pt " + self.labels[label].f;
                
                self.context.font = font;
                if (self.labels[label].x * self.scale + self.offset.x < x && 
                    x < self.labels[label].x * self.scale + self.offset.x + self.context.measureText(self.labels[label].v).width && 
                    self.labels[label].y * self.scale + self.offset.y - self.labels[label].p < y && 
                    y < self.labels[label].y * self.scale + self.offset.y) {
                        self.setSelectedLabel(label);
                }
            }
        },

        onMouseDown: function(event, callback) {
            var self = this;
            self.getPointInBoundingBox(event.x, event.y);
            if (self.selectedLabel) {
                self.canvas.style.cursor = "move";
            }
            if (!self.selectedLabel) {
                self.startLabel(event.x, event.y);
            }
            callback();
        },

        onMouseMove: function(event, callback) {
            var self = this;
            if (self.selectedLabel) {
                self.labels[self.selectedLabel].x += event.movementX / self.scale;
                self.labels[self.selectedLabel].y += event.movementY / self.scale;
                callback();
            }
        },

        onMouseUp: function(event, callback) {
            var self = this;
            self.canvas.style.cursor = "default";
            callback();
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
        self.m_canvas = document.createElement('canvas');
        self.m_canvas.width = self.tileWidth;
        self.m_canvas.height = self.tileHeight;
        self.m_context = self.m_canvas.getContext('2d');
        self.m2_canvas = document.createElement('canvas');
        self.m2_canvas.width = self.tileWidth;
        self.m2_canvas.height = self.tileHeight;
        self.m2_context = self.m2_canvas.getContext('2d');

        self.initialize();
    }

    TerrainController.prototype = {
        initialize: function() {
            var self = this;
            if (!self.terrain || !self.terrain.length) {
                self.terrain = [
                    new Terrain(0, 'Blank', '/images/terrain/blank/', 500, 0),
                    new Terrain(1, 'Ocean', '/images/terrain/ocean/', 0, 0),
                    new Terrain(10, 'Grass', '/images/terrain/grass/', 500, 0),
                    new Terrain(11, 'Forest', '/images/terrain/forest/', 500, 2)
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

        getRandomTerrainFeatureById: function(id) {
            var self = this;
            return self.terrain.find(item => item.id == id).images.length - 1;
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

        getRandomTerrainFeature: function() {
            var self = this;
            if (self.getTerrainById(self.getSelectedTerrainId()).images.length == 1) {
                return null;
            }
            var features = self.getTerrainById(self.getSelectedTerrainId()).images.length - 2;
            var number = Math.round(features * Math.random()) + 1;
            console.log(number);
            return number;
        },

        changeTerrainTile: function(event, callback) {
            var self = this;
            var tileIndex = self.getTileIndex(event.offsetX, event.offsetY);
            if (tileIndex !== undefined) {
                var index = self.tiles.findIndex(tile => tile.x == tileIndex.x && tile.y == tileIndex.y);
                if (index > -1) {
                    if (event.type != "mousemove" || self.tiles[index].t !== self.getSelectedTerrainId()) {
                        self.tiles[index].t = self.getSelectedTerrainId();
                        self.tiles[index].f = self.getRandomTerrainFeature();    
                    }
                } else {
                    self.tiles.push({x: tileIndex.x, y: tileIndex.y, t: self.getSelectedTerrainId(), f: self.getRandomTerrainFeature()})
                }    
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
        
        drawOverlay: function(xIndex, yIndex, zIndex, x, y, i) {
            var self = this;
            var tile = self.tiles.filter(tile => tile.x == x && tile.y == y);
            if (tile.length > 0) {
                var terrain = self.getTerrainById(tile[0].t);
                if (terrain.baseZIndex > zIndex) {
                    var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
                    self.m2_context.drawImage(terrain.overlay[i].element, 0, 0, self.getTileWidth(), self.getTileHeight());
                }
            }
        },

        drawOverlays: function(xIndex, yIndex, zIndex) {
            var self = this;
            var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
            self.drawOverlay(xIndex, yIndex, zIndex, xIndex, yIndex - 1, 0);
            self.drawOverlay(xIndex, yIndex, zIndex, xIndex - 1, isEvenRow ? yIndex : yIndex - 1 , 1);
            self.drawOverlay(xIndex, yIndex, zIndex, xIndex + 1, isEvenRow ? yIndex : yIndex - 1, 2);
            self.drawOverlay(xIndex, yIndex, zIndex, xIndex - 1, isEvenRow ? yIndex + 1 : yIndex, 3);
            self.drawOverlay(xIndex, yIndex, zIndex, xIndex + 1, isEvenRow ? yIndex + 1 : yIndex, 4);
            self.drawOverlay(xIndex, yIndex, zIndex, xIndex, yIndex + 1, 5);
        },

        drawShore: function(xIndex, yIndex, zIndex, x, y, i) {
            var self = this;
            var tile = self.tiles.filter(tile => tile.x == x && tile.y == y);
            if (tile.length > 0) {
                var terrain = self.getTerrainById(tile[0].t);
                var ocean = self.getTerrainById(1);
                if (terrain.baseZIndex > zIndex) {
                    self.m_context.globalCompositeOperation = "lighten";
                    self.m_context.drawImage(ocean.overlay[i].element, 0, 0, self.getTileWidth(), self.getTileHeight());
                }
            }
        },

        prepareShores: function(xIndex, yIndex, zIndex) {
            var self = this;
            self.m_context.clearRect(0, 0, self.m_canvas.width, self.m_canvas.height);
            self.m_context.save();
            var isEvenRow = Math.abs(xIndex) %2 == 1;
            self.drawShore(xIndex, yIndex, zIndex, xIndex, yIndex - 1, 0);
            self.drawShore(xIndex, yIndex, zIndex, xIndex - 1, isEvenRow ? yIndex : yIndex - 1 , 1);
            self.drawShore(xIndex, yIndex, zIndex, xIndex + 1, isEvenRow ? yIndex : yIndex - 1, 2);
            self.drawShore(xIndex, yIndex, zIndex, xIndex - 1, isEvenRow ? yIndex + 1 : yIndex, 3);
            self.drawShore(xIndex, yIndex, zIndex, xIndex + 1, isEvenRow ? yIndex + 1 : yIndex, 4);
            self.drawShore(xIndex, yIndex, zIndex, xIndex, yIndex + 1, 5);
            self.m_context.restore();
        },
        
        prepareOverlays: function(xIndex, yIndex, zIndex) {
            var self = this;
            self.m2_context.clearRect(0, 0, self.m2_canvas.width, self.m2_canvas.height);
            self.m2_context.save();
            self.drawOverlays(xIndex, yIndex, zIndex);
            self.m2_context.globalCompositeOperation = "destination-in";
            self.m2_context.drawImage(self.m_canvas, 0, 0);
            self.m2_context.globalCompositeOperation = "multiply";
            self.m2_context.drawImage(self.m_canvas, 0, 0);
            self.m2_context.restore();
        },

        drawShores: function(xIndex, yIndex, zIndex) {
            var self = this;
            self.prepareShores(xIndex, yIndex, zIndex);
            self.prepareOverlays(xIndex, yIndex, zIndex);
            var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
            self.context.drawImage(self.m2_canvas, self.getCartesianX(xIndex), self.getCartesianY(yIndex, isEvenRow),
                self.getTileWidth(), self.getTileHeight());
        },

        drawTile: function(xIndex, yIndex) {
            var self = this;
            var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
            var tile = self.tiles.find(tile => tile.x == xIndex && tile.y == yIndex);
            if (tile) {
                var terrain = self.getTerrainById(tile.t);
                self.context.drawImage(terrain.images[0].element, self.getCartesianX(xIndex), self.getCartesianY(yIndex, isEvenRow),
                    self.getTileWidth(), self.getTileHeight());
                    self.drawShores(xIndex, yIndex, terrain.baseZIndex);
                    if (tile.f !== null) {
                        var terrainFeature = terrain.images[tile.f].element;
                        var startX = self.getCartesianX(xIndex) - (terrainFeature.width - 300) / 2;
                        var startY = self.getCartesianY(yIndex, isEvenRow) - (terrainFeature.height - 150) / 2;
                        self.context.drawImage(terrainFeature, startX, startY,
                            terrainFeature.width, terrainFeature.height);
                    }
            } else {
                self.context.drawImage(self.getTerrainById(0).images[0].element, self.getCartesianX(xIndex), self.getCartesianY(yIndex, isEvenRow),
                    self.getTileWidth(), self.getTileHeight());
            }
        },

        render: function() {
            var self = this;
            var bounds = self.getBounds();
            for (var yIndex = bounds.yMin; yIndex < bounds.yMax; yIndex++) {
                for (var xIndex = Math.abs(bounds.xMin) % 2 == 0 ? bounds.xMin : bounds.xMin + 1; xIndex < bounds.xMax; xIndex += 2) {
                    self.drawTile(xIndex, yIndex);
                }
                for (var xIndex = Math.abs(bounds.xMin) % 2 == 1 ? bounds.xMin : bounds.xMin + 1; xIndex < bounds.xMax; xIndex += 2) {
                    self.drawTile(xIndex, yIndex);
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
        self.labelController;

        self.initialize(mapData.tiles, mapData.roads, mapData.rivers, mapData.labels);
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
            self.labelController.clearSelectedLabel();
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
            if (self.activeLayer == 'label') {
                self.labelController.clearSelectedLabel();
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
            if (self.activeLayer == 'label') {
                self.labelController.deleteSelectedLabel();
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
            if (self.activeLayer == 'label') {
                self.labelController.onMouseDown(event, self.mapUpdated.bind(self));
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
            if (self.activeLayer == 'label') {
                self.labelController.onMouseMove(event, self.render.bind(self));
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
            if (self.activeLayer == 'label') {
                self.labelController.onMouseUp(event, self.mapUpdated.bind(self));
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
            self.labelController.updateOffset(x, y);
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
                roads: self.roadController.getRoads(), rivers: self.riverController.getRivers(), labels: self.labelController.getLabels()});
        },

        render: function() {
            var self = this;
            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
            self.terrainController.render();
            self.riverController.render();
            self.roadController.render();
            self.labelController.render();
        },

        zoomIn: function() {
            var self = this;
            self.scale = Math.min(self.scale + .05, 1);
            self.terrainController.setScale(self.scale);
            self.roadController.setScale(self.scale);
            self.riverController.setScale(self.scale);
            self.labelController.setScale(self.scale);
            self.render();
        },

        zoomOut: function() {
            var self = this;
            self.scale = Math.max(self.scale - .05, .3);
            self.terrainController.setScale(self.scale);
            self.roadController.setScale(self.scale);
            self.riverController.setScale(self.scale);
            self.labelController.setScale(self.scale);
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

        initialize: function(tiles, roads, rivers, labels) {
            var self = this;
            var tulpagraphyContainer = document.getElementById('tulpagraphy');
            self.canvas = document.createElement('canvas');
            tulpagraphyContainer.appendChild(self.canvas);
            self.context = self.canvas.getContext('2d');
            var toolbar = document.createElement('div');
            toolbar.setAttribute('id', 'toolbar');
            toolbar.setAttribute('class', 'toolbar');
            self.terrainController = new TerrainController(tiles, self.canvas, self.context);
            self.roadController = new RoadController(roads, self.canvas, self.context);
            self.riverController = new RiverController(rivers, self.canvas, self.context);
            self.labelController = new LabelController(labels, self.canvas, self.context);
            self.terrainController.terrain.forEach(function(item) {
                var tool = document.createElement('img');
                tool.setAttribute('src', item.imageDirectory + 'tool.png');
                tool.setAttribute('title', item.name);
                tool.setAttribute('alt', item.name);
                tool.addEventListener('click', self.terrainController.setSelectedTerrainId.bind(self.terrainController, item.id));
                toolbar.appendChild(tool);
            });
            tulpagraphyContainer.appendChild(toolbar);
            
            var labelToolbar = document.createElement('div');
            labelToolbar.setAttribute('id', 'labelToolbar');
            labelToolbar.setAttribute('class', 'toolbar');
            var text = document.createElement('input');
            text.setAttribute('type', 'text');
            text.setAttribute('id', 'labelText');
            text.addEventListener('input', self.labelController.updateLabelText.bind(self.labelController, self.mapUpdated.bind(self)));
            labelToolbar.appendChild(text);

            var fontSize = document.createElement('select');
            fontSize.setAttribute('id', 'fontSize');
            for (var i = 16; i <=60; i+=4) {
                var sizeOption = document.createElement('option');
                sizeOption.text = i;
                fontSize.add(sizeOption);
            }
            fontSize.addEventListener('change', self.labelController.updateFontSize.bind(self.labelController, self.mapUpdated.bind(self)));
            labelToolbar.appendChild(fontSize);
            var fonts = document.createElement('select');
            fonts.setAttribute('id', 'fonts');
            var fontNames = [{text: "Arial", value: "Arial"}, {text: "Arial Black", value: "'Arial Black'"}, {text: "Comic Sans MS", value: "'Comic Sans MS'"},
                             {text: "Courier New", value: "'Courier New'"}, {text: "Helvetica", value: "helvetica"}, {text: "Impact", value: "hoge,impact"}, 
                             {text: "Times New Roman", value: "'Times New Roman'"}, {text: "Trebuchet MS", value: "'Trebuchet MS'"}, {text: "Verdana", value: "Verdana"}]
            for (var i = 0; i < fontNames.length; i++) {
                var fontOption = document.createElement('option');
                fontOption.value = fontNames[i].value;
                fontOption.text = fontNames[i].text;
                fonts.add(fontOption);
            }
            fonts.addEventListener('change', self.labelController.updateFont.bind(self.labelController, self.mapUpdated.bind(self)));
            labelToolbar.appendChild(fonts);

            var colorPicker = document.createElement('input');
            colorPicker.setAttribute('value', '#000000');
            colorPicker.setAttribute('type', 'color');
            colorPicker.setAttribute('id', 'colorPicker');
            labelToolbar.appendChild(colorPicker);
            colorPicker.addEventListener('change', self.labelController.updateFontColor.bind(self.labelController, self.mapUpdated.bind(self)));

            var boldCheckbox = document.createElement('input');
            boldCheckbox.setAttribute('type', 'checkbox');
            boldCheckbox.setAttribute('id', 'bold');
            labelToolbar.appendChild(boldCheckbox);
            boldCheckbox.addEventListener('click', self.labelController.updateBold.bind(self.labelController, self.mapUpdated.bind(self)));

            var italicCheckbox = document.createElement('input');
            italicCheckbox.setAttribute('type', 'checkbox');
            italicCheckbox.setAttribute('id', 'italic');
            labelToolbar.appendChild(italicCheckbox);
            italicCheckbox.addEventListener('click', self.labelController.updateItalic.bind(self.labelController, self.mapUpdated.bind(self)));

            tulpagraphyContainer.appendChild(labelToolbar);
            document.getElementById('labelToolbar').style.display = 'none';

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
        self.overlay = [new MapImage(imageDirectory + 'n.png'), new MapImage(imageDirectory + 'nw.png'), new MapImage(imageDirectory + 'ne.png'),
                        new MapImage(imageDirectory + 'sw.png'), new MapImage(imageDirectory + 'se.png'), new MapImage(imageDirectory + 's.png')];
        self.images = [];

        for (var i = 0; i <= number; i++) {
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
            self.overlay.forEach(function(image) {
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
            localStorage.setItem(id, JSON.stringify({id: id, name: 'untitled', tiles: [], roads: [], rivers:[], labels:[]}));
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