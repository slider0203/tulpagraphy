tg = (function() {
    function TulpaEvent() {
        this.button = 0;
    }

    TulpaEvent.prototype = {
        mouseDown: function(primaryCallback, secondaryCallback, event) {
            this.button = event.buttons;
            if (this.button == 1) {
                primaryCallback(event);
            }
            if (this.button == 2) {
                secondaryCallback(event);
            }
            event.preventDefault();
            return false;
        },
        
        mouseMove: function(primaryCallback, secondaryCallback, event) {
            if (this.button == 1) {
                primaryCallback(event);
            }
            if (this.button == 2) {
                secondaryCallback(event);
            }
            event.preventDefault();
            return false;
        },

        mouseUp: function(primaryCallback, secondaryCallback, event) {
            if (this.button == 1) {
                primaryCallback(event);
            }
            if (this.button == 2) {
                secondaryCallback(event);
            }
            this.button = 0;
            event.preventDefault();
            return false;
        },

        mouseClick: function(callback, event) {
            callback(event);
            event.preventDefault();
            return false;
        },

        mouseRightClick: function(callback, event) {
            callback(event);
            event.preventDefault();
            return false;
        }
    };

    function LandmarkController(landmarks, canvas, context) {
        this.landmarks = landmarks;
        this.landmarkOptions;
        this.canvas = canvas;
        this.context = context;
        this.selectedLandmark = null;
        this.selectedLandmarkOption = null;

        this.initialize();
    }

    LandmarkController.prototype = {
        initialize: function() {
            if (!this.landmarkOptions || !this.landmarkOptions.length) {
                this.landmarkOptions = [
                    new Landmark(0, 'Marker', '/images/landmarks/marker.png'),
                    new Landmark(1, 'Goblin Camp', '/images/landmarks/goblin camp.png'),
                    new Landmark(2, 'Pavilion', '/images/landmarks/pavilion.png')
                ];
            }
        },

        landmarkOptionsLoaded: function() {
            var loaded = true;
            this.landmarkOptions.forEach(landmark => {
                if (!landmark.loaded()) {
                    loaded = false;
                    return;
                }
            });
            return loaded;
        },

        getLandmarks: function() {
            return this.landmarks;
        },

        scale: function() {
            return sessionStorage.getItem('scale');
        },

        offset: function() {
            return {x: +sessionStorage.getItem('xOffset'), y: +sessionStorage.getItem('yOffset')};
        },

        getLandmarkById: function(id) {
            return this.landmarkOptions.find(item => item.id == id);
        },

        setSelectedLandmarkById: function(id) {
            this.selectedLandmarkOption = id;
        },
        
        clearSelectedLandmark: function() {
            this.selectedLandmark = null;
        },
        
        deleteSelectedLandmark: function() {
            if (this.selectedLandmark !== null) {
                this.landmarks.splice(this.selectedLandmark, 1);
                this.selectedLandmark = null;
            }
        },

        placeLandmark: function(x, y) {
            this.selectedLandmark = this.landmarks.length;
            this.landmarks.push({x: (x - this.offset().x) / this.scale(), 
                y: (y - this.offset().y) / this.scale(), l: this.selectedLandmarkOption });
        },

        render: function() {
            for (var landmark in this.landmarks) {
                let landmarkOption = this.getLandmarkById(this.landmarks[landmark].l);
                
                this.context.drawImage(landmarkOption.image.element, this.landmarks[landmark].x * this.scale() + this.offset().x,
                    this.landmarks[landmark].y * this.scale() + this.offset().y, 
                    landmarkOption.image.element.width * this.scale(), landmarkOption.image.element.height * this.scale());
            }
            if (this.selectedLandmark !== null) {
                let landmarkOption = this.getLandmarkById(this.landmarks[this.selectedLandmark].l);
                this.context.lineWidth = 1;
                this.context.strokeStyle = '#C00';

                this.context.strokeRect(this.landmarks[this.selectedLandmark].x * this.scale() + this.offset().x,
                    this.landmarks[this.selectedLandmark].y * this.scale() + this.offset().y,
                    landmarkOption.image.element.width, landmarkOption.image.element.height);
            }
        },
        
        getPointInBoundingBox: function(x, y) {
            this.selectedLandmark = null;
            for(var landmark in this.landmarks) {
                var landmarkOption = this.getLandmarkById(this.landmarks[landmark].l);
                if (this.landmarks[landmark].x * this.scale() + this.offset().x < x && 
                    x < this.landmarks[landmark].x * this.scale() + this.offset().x + landmarkOption.image.element.width && 
                    y > this.landmarks[landmark].y * this.scale() + this.offset().y &&
                    this.landmarks[landmark].y * this.scale() + this.offset().y + landmarkOption.image.element.height > y) {
                    this.selectedLandmark = landmark;
                }
            }
        },

        onMouseDown: function(event, callback) {
            this.getPointInBoundingBox(event.x, event.y);
            if (this.selectedLandmark) {
                this.canvas.style.cursor = 'move';
            }
            if (!this.selectedLandmark) {
                this.placeLandmark(event.x, event.y);
            }
            callback();
        },

        onMouseMove: function(event, callback) {
            if (this.selectedLandmark) {
                this.landmarks[this.selectedLandmark].x += event.movementX / this.scale();
                this.landmarks[this.selectedLandmark].y += event.movementY / this.scale();
                callback();
            }
        },

        onMouseUp: function(event, callback) {
            this.canvas.style.cursor = 'default';
            callback();
        }
    };

    function LabelController(labels, canvas, context) {
        this.labels = labels;
        this.canvas = canvas;
        this.context = context;
        this.selectedLabel = null;
    }

    LabelController.prototype = {
        getLabels: function() {
            // Remove all labels that consist of no letters
            return this.labels.filter(label => label.v.length > 1);
        },

        setSelectedLabel: function(selectedLabel) {
            this.selectedLabel = selectedLabel;
            document.getElementById('labelToolbar').style.display = 'block';
            document.getElementById('labelText').value = this.labels[this.selectedLabel].v;
            var fontSize = document.getElementById('fontSize');
            for (let i = 0; i < fontSize.options.length; i++) {
                if (fontSize.options[i].text == this.labels[this.selectedLabel].p) {
                    fontSize.selectedIndex = i;
                    break;
                }
            }
            var fonts = document.getElementById('fonts');
            for (let i = 0; i < fonts.options.length; i++) {
                if (fonts.options[i].value == this.labels[this.selectedLabel].f) {
                    fonts.selectedIndex = i;
                    break;
                }
            }
            document.getElementById('colorPicker').value = this.labels[this.selectedLabel].c;
            document.getElementById('bold').checked = this.labels[this.selectedLabel].b;
            document.getElementById('italic').checked = this.labels[this.selectedLabel].i;
        },
        
        clearSelectedLabel: function() {
            this.selectedLabel = null;
            document.getElementById('labelToolbar').style.display = 'none';
        },

        scale: function() {
            return sessionStorage.getItem('scale');
        },

        offset: function() {
            return {x: +sessionStorage.getItem('xOffset'), y: +sessionStorage.getItem('yOffset')};
        },

        updateFontColor: function(callback, event) {
            this.labels[this.selectedLabel].c = event.srcElement.value;
            callback();
        },

        updateBold: function(callback, event) {
            this.labels[this.selectedLabel].b = event.srcElement.checked;
            callback();
        },

        updateItalic: function(callback, event) {
            this.labels[this.selectedLabel].i = event.srcElement.checked;
            callback();
        },

        updateFontSize: function(callback, event) {
            this.labels[this.selectedLabel].p = event.srcElement.selectedOptions[0].text;
            callback();
        },

        updateFont: function(callback, event) {
            this.labels[this.selectedLabel].f = event.srcElement.selectedOptions[0].value;
            callback();
        },

        updateLabelText: function(callback, event) {
            this.labels[this.selectedLabel].v = event.srcElement.value;
            callback();
        },

        deleteSelectedLabel: function() {
            if (this.selectedLabel !== null) {
                this.labels.splice(this.selectedLabel, 1);
                this.clearSelectedLabel();
            }
        },

        startLabel: function(x, y) {
            this.labels.push({x: (x - this.offset().x) / this.scale(), y: (y - this.offset().y) / this.scale(), v: 'Label', f: 'Arial', p: 32, c: '#000000', b: false, i: false});
            this.setSelectedLabel(this.labels.length - 1);
        },

        render: function() {
            for(var label in this.labels) {
                let font = this.labels[label].b ? 'bold ' : '';
                font += this.labels[label].i ? 'italic ' : '';
                font += this.labels[label].p * this.scale() + 'pt ' + this.labels[label].f;
                
                this.context.font = font;
                this.context.fillStyle = this.labels[label].c;
                this.context.fillText(this.labels[label].v, this.labels[label].x * this.scale() + this.offset().x, this.labels[label].y * this.scale() + this.offset().y);
            }

            if (this.selectedLabel !== null) {
                let font = this.labels[this.selectedLabel].b ? 'bold ' : '';
                font += this.labels[this.selectedLabel].i ? 'italic ' : '';
                font += this.labels[this.selectedLabel].p * this.scale() + 'pt ' + this.labels[this.selectedLabel].f;
                
                this.context.font = font;
                let metrics = this.context.measureText(this.labels[this.selectedLabel].v);
                this.context.strokeStyle = '#C00';
                this.context.lineWidth = 1;
                this.context.strokeRect(this.labels[this.selectedLabel].x * this.scale() + this.offset().x - 1,
                    this.labels[this.selectedLabel].y * this.scale() + this.offset().y - 1 - (this.labels[this.selectedLabel].p * this.scale()),
                    metrics.width + 1, this.labels[this.selectedLabel].p * this.scale() + 1);
            }
        },

        getPointInBoundingBox: function(x, y) {
            this.clearSelectedLabel();
            for(var label in this.labels) {
                var font = this.labels[label].b ? 'bold ' : '';
                font += this.labels[label].i ? 'italic ' : '';
                font += this.labels[label].p * this.scale() + 'pt ' + this.labels[label].f;
                
                this.context.font = font;
                if (this.labels[label].x * this.scale() + this.offset().x < x && 
                    x < this.labels[label].x * this.scale() + this.offset().x + this.context.measureText(this.labels[label].v).width && 
                    this.labels[label].y * this.scale() + this.offset().y - this.labels[label].p < y && 
                    y < this.labels[label].y * this.scale() + this.offset().y) {
                    this.setSelectedLabel(label);
                }
            }
        },

        onMouseDown: function(event, callback) {
            this.getPointInBoundingBox(event.x, event.y);
            if (this.selectedLabel) {
                this.canvas.style.cursor = 'move';
            }
            if (!this.selectedLabel) {
                this.startLabel(event.x, event.y);
            }
            callback();
        },

        onMouseMove: function(event, callback) {
            if (this.selectedLabel) {
                this.labels[this.selectedLabel].x += event.movementX / this.scale();
                this.labels[this.selectedLabel].y += event.movementY / this.scale();
                callback();
            }
        },

        onMouseUp: function(event, callback) {
            this.canvas.style.cursor = 'default';
            callback();
        }
    };

    function RoadController(roads, canvas, context) {
        this.roads = roads;
        this.canvas = canvas;
        this.context = context;
        this.selectedPoint = null;
        this.selectedRoad = null;
        this.style = {
            curve:	{ width: 6, color: '#333' },
            cpline:	{ width: 1, color: '#C00' },
            point: { radius: 10, width: 2, color: '#900', fill: 'rgba(200,200,200,0.5)', arc1: 0, arc2: 2 * Math.PI }
        };
    }

    RoadController.prototype = {
        getRoads: function() {
            // Remove all roads that consist of a single point
            return this.roads.filter(road => road.length > 1);
        },

        scale: function() {
            return sessionStorage.getItem('scale');
        },

        offset: function() {
            return {x: +sessionStorage.getItem('xOffset'), y: +sessionStorage.getItem('yOffset')};
        },

        clearSelectedRoad: function() {
            this.selectedRoad = null;
        },

        deleteSelectedRoad: function() {
            this.roads.splice(this.selectedRoad, 1);
            this.selectedRoad = null;
        },

        startRoad: function(x, y) {
            this.selectedRoad = this.roads.length;
            this.roads.push([{x: (x - this.offset().x) / this.scale(), y: (y - this.offset().y) / this.scale(), c: false}]);
        },

        addAnchor: function(x, y) {
            var controlPoint = this.calculateNewControlPointLocation(x, y, this.roads[this.selectedRoad].length - 1);
            this.roads[this.selectedRoad].push({x: controlPoint.x, y: controlPoint.y, c: true});
            this.roads[this.selectedRoad].push({x: (x - this.offset().x) / this.scale(), y: (y - this.offset().y) / this.scale(), c: false});
        },

        calculateNewControlPointLocation: function(x, y, index) {
            var anchor = this.roads[this.selectedRoad][index];
            var cpx = (x - this.offset().x) / this.scale() + (anchor.x + (this.offset().x - x) / this.scale()) / 2;
            var cpy = (y - this.offset().y) / this.scale() + (anchor.y + (this.offset().y - y) / this.scale()) / 2;
            return {x: cpx, y: cpy};
        },

        isPointOnSelectedPath: function(x, y) {
            this.drawRoad(this.roads[this.selectedRoad]);
            return this.context.isPointInStroke(x, y);
        },

        drawRoad: function(road) {
            this.context.lineWidth = this.style.curve.width * this.scale();
            this.context.beginPath();
            this.context.moveTo(road[0].x * this.scale() + this.offset().x, road[0].y * this.scale() + this.offset().y);

            var control;
            for(var i = 1; i < road.length; i++) {
                if (road[i].c) {
                    control = road[i];
                }
                else {
                    this.context.quadraticCurveTo(control.x * this.scale() + this.offset().x, control.y * this.scale() + this.offset().y,
                        road[i].x * this.scale() + this.offset().x, road[i].y * this.scale() + this.offset().y);
                }
            }
        },

        drawRoadSegment: function(origin, control, end) {
            this.context.lineWidth = this.style.curve.width * this.scale();
            this.context.beginPath();
            this.context.moveTo(origin.x * this.scale() + this.offset().x, origin.y * this.scale() + this.offset().y);
            this.context.quadraticCurveTo(control.x * this.scale() + this.offset().x, control.y * this.scale() + this.offset().y,
                end.x * this.scale() + this.offset().x, end.y * this.scale() + this.offset().y);
        },

        insertAnchorOnSegment: function(x, y) {
            var road = this.roads[this.selectedRoad];
            for(let i = 2; i < road.length; i += 2) {
                this.drawRoadSegment(road[i - 2], road[i - 1], road[i]);

                if (this.context.isPointInStroke(x, y)) {
                    var controlPoint = this.calculateNewControlPointLocation(x, y, i - 2);
                    this.roads[this.selectedRoad].splice(i - 1, 0, {x: controlPoint.x, y: controlPoint.y, c: true});
                    this.roads[this.selectedRoad].splice(i, 0, {x: (x - this.offset().x) / this.scale(), y: (y - this.offset().y) / this.scale(), c: false});
                    return;
                }
            }
        },

        insertAnchor: function(x, y) {
            if (this.isPointOnSelectedPath) {
                this.insertAnchorOnSegment(x, y);
            }
        },

        deleteAnchor: function() {
            if (this.selectedPoint !== null) {
                this.roads[this.selectedRoad].splice(Math.max(this.selectedPoint - 1, 0), 2);
                if (this.roads[this.selectedRoad].length === 0) {
                    this.roads.splice(this.selectedRoad, 1);
                    this.selectedRoad = null;
                }
                this.selectedPoint = null;
            }
        },

        render: function() {
            if (this.roads.length > 0) {
                this.context.save();
                this.context.lineCap = 'round';
                this.context.lineJoin = 'round';
                this.drawRoads();
                this.drawControlLines();
                this.drawInteractionPoints();
                this.context.restore();
            }
        },

        drawRoads: function() {
            this.context.setLineDash([5 * this.scale(), 15 * this.scale()]);
            this.context.strokeStyle = this.style.curve.color;
            for (var r in this.roads) {
                this.drawRoad(this.roads[r]);
                this.context.stroke();
            }
            this.context.setLineDash([]);
        },

        drawControlLines: function() {
            if (this.selectedRoad !== null) {
                this.context.lineWidth = this.style.cpline.width;
                this.context.strokeStyle = this.style.cpline.color;
                this.context.beginPath();
                this.context.moveTo(this.roads[this.selectedRoad][0].x * this.scale() + this.offset().x, this.roads[this.selectedRoad][0].y * this.scale() + this.offset().y);
    
                for(var i = 1; i < this.roads[this.selectedRoad].length; i++) {
                    this.context.lineTo(this.roads[this.selectedRoad][i].x * this.scale() + this.offset().x, this.roads[this.selectedRoad][i].y * this.scale() + this.offset().y);
                }
    
                this.context.stroke();
            }
        },

        drawInteractionPoints: function() {
            if (this.selectedRoad !== null) {
                this.context.lineWidth = this.style.point.width;
                this.context.strokeStyle = this.style.point.color;
                this.context.fillStyle = this.style.point.fill;
                for (var p in this.roads[this.selectedRoad]) {
                    this.context.beginPath();
                    this.context.arc(this.roads[this.selectedRoad][p].x * this.scale() + this.offset().x,
                        this.roads[this.selectedRoad][p].y * this.scale() + this.offset().y, this.style.point.radius,
                        this.style.point.arc1, this.style.point.arc2, true);
                    this.context.fill();
                    this.context.stroke();
                }
            }
        },

        getPointInSelectedRoad: function(x, y) {
            var dx;
            var dy;
            for (var p in this.roads[this.selectedRoad]) {
                dx = this.roads[this.selectedRoad][p].x * this.scale() + this.offset().x - x;
                dy = this.roads[this.selectedRoad][p].y * this.scale() + this.offset().y - y;
                if ((dx * dx) + (dy * dy) < this.style.point.radius * this.style.point.radius) {
                    this.selectedPoint = p;
                    return;
                }
            }
        },

        getRoadByPointInPath: function(x, y) {
            for (var r in this.roads) {
                this.context.lineWidth = this.style.curve.width;
                this.drawRoad(this.roads[r]);
                if (this.context.isPointInStroke(x, y)) {
                    return r;
                }
            }
            return null;
        },

        onMouseDown: function(event, callback) {
            if (this.selectedRoad !== null) {
                this.getPointInSelectedRoad(event.x, event.y);
                if (this.selectedPoint) {
                    this.canvas.style.cursor = 'move';
                }
            }
            if (!this.selectedPoint) {
                var r = this.getRoadByPointInPath(event.x, event.y);
                if (r !== null) {
                    if (this.selectedRoad !== r) {
                        this.selectedRoad = r;
                    }
                    else {
                        this.clearSelectedRoad();
                    }
                }
                else if (this.selectedRoad !== null) {
                    this.addAnchor(event.x, event.y);
                }
                else {
                    this.startRoad(event.x, event.y);
                }
            }
            callback();
        },

        onMouseMove: function(event, callback) {
            if (this.selectedPoint) {
                this.roads[this.selectedRoad][this.selectedPoint].x += event.movementX / this.scale();
                this.roads[this.selectedRoad][this.selectedPoint].y += event.movementY / this.scale();
                callback();
            }
        },

        onMouseUp: function(event, callback) {
            this.selectedPoint = null;
            this.canvas.style.cursor = 'default';
            callback();
        },

        onRightClick: function(event, callback) {
            this.getPointInSelectedRoad(event.x, event.y);
            if (this.selectedPoint !== null) {
                this.deleteAnchor();
            } else {
                this.insertAnchor(event.x, event.y);
            }
            callback();
        }
    };
    
    function RiverController(rivers, canvas, context) {
        this.rivers = rivers;
        this.canvas = canvas;
        this.context = context;
        this.selectedPoint = null;
        this.selectedRiver = null;
        this.style = {
            curve:	{ width: 6, color: '#688aa3' },
            cpline:	{ width: 1, color: '#C00' },
            point: { radius: 10, width: 2, color: '#900', fill: 'rgba(200,200,200,0.5)', arc1: 0, arc2: 2 * Math.PI }
        };
    }

    RiverController.prototype = {
        getRivers: function() {
            // Remove all rivers that consist of a single point
            return this.rivers.filter(river => river.length > 1);
        },

        scale: function() {
            return sessionStorage.getItem('scale');
        },

        offset: function() {
            return {x: +sessionStorage.getItem('xOffset'), y: +sessionStorage.getItem('yOffset')};
        },

        clearSelectedRiver: function() {
            this.selectedRiver = null;
        },

        deleteSelectedRiver: function() {
            this.rivers.splice(this.selectedRiver, 1);
            this.selectedRiver = null;
        },

        startRiver: function(x, y) {
            this.selectedRiver = this.rivers.length;
            this.rivers.push([{x: (x - this.offset().x) / this.scale(), y: (y - this.offset().y) / this.scale(), c: false}]);
        },

        addAnchor: function(x, y) {
            var anchor = this.rivers[this.selectedRiver][this.rivers[this.selectedRiver].length - 1];
            this.rivers[this.selectedRiver].push({x: (anchor.x) + 50, y: (anchor.y) + 50, c: true});
            this.rivers[this.selectedRiver].push({x: (x - this.offset().x) / this.scale() - 50, y: (y - this.offset().y) / this.scale() - 50, c: true});
            this.rivers[this.selectedRiver].push({x: (x - this.offset().x) / this.scale(), y: (y - this.offset().y) / this.scale(), c: false});
        },

        isPointOnSelectedPath: function(x, y) {
            this.drawRiver(this.rivers[this.selectedRiver]);
            return this.context.isPointInStroke(x, y);
        },

        drawRiver: function(river) {
            this.context.lineWidth = this.style.curve.width * this.scale();
            this.context.beginPath();
            this.context.moveTo(river[0].x * this.scale() + this.offset().x, river[0].y * this.scale() + this.offset().y);

            var controls = [];
            for(var i = 1; i < river.length; i++) {
                if (river[i].c) {
                    controls.push(river[i]);
                }
                else {
                    this.context.bezierCurveTo(controls[0].x * this.scale() + this.offset().x, controls[0].y * this.scale() + this.offset().y,
                        controls[1].x * this.scale() + this.offset().x, controls[1].y * this.scale() + this.offset().y,
                        river[i].x * this.scale() + this.offset().x, river[i].y * this.scale() + this.offset().y);
                    controls = [];
                }
            }
        },

        drawRiverSegment: function(origin, control1, control2, end) {
            this.context.lineWidth = this.style.curve.width * this.scale();
            this.context.beginPath();
            this.context.moveTo(origin.x * this.scale() + this.offset().x, origin.y * this.scale() + this.offset().y);
            this.context.bezierCurveTo(control1.x * this.scale() + this.offset().x, control1.y * this.scale() + this.offset().y,
                control2.x * this.scale() + this.offset().x, control2.y * this.scale() + this.offset().y,
                end.x * this.scale() + this.offset().x, end.y * this.scale() + this.offset().y);
        },

        insertAnchorOnSegment: function(x, y) {
            var river = this.rivers[this.selectedRiver];
            for(var i = 3; i < river.length; i += 3) {
                this.drawRiverSegment(river[i - 3], river[i - 2], river[i - 1], river[i]);

                if (this.context.isPointInStroke(x, y)) {
                    this.rivers[this.selectedRiver].splice(i - 1, 0, {x: (x - this.offset().x) / this.scale() + 50, y: (y - this.offset().y) / this.scale() + 50, c: true});
                    this.rivers[this.selectedRiver].splice(i, 0, {x: (x - this.offset().x) / this.scale(), y: (y - this.offset().y) / this.scale(), c: false});
                    this.rivers[this.selectedRiver].splice(i + 1, 0, {x: (x - this.offset().x) / this.scale() - 50, y: (y - this.offset().y) / this.scale() - 50, c: true});
                    return;
                }
            }
        },

        insertAnchor: function(x, y) {
            if (this.isPointOnSelectedPath) {
                this.insertAnchorOnSegment(x, y);
            }
        },

        deleteAnchor: function() {
            if (this.selectedPoint !== null) {
                this.rivers[this.selectedRiver].splice(Math.max(this.selectedPoint - 1, 0), 3);
                if (this.rivers[this.selectedRiver].length === 0) {
                    this.rivers.splice(this.selectedRiver, 1);
                    this.selectedRiver = null;
                }
                this.selectedPoint = null;
            }
        },

        render: function() {
            if (this.rivers.length > 0) {
                this.context.save();
                this.context.lineCap = 'round';
                this.context.lineJoin = 'round';
                this.drawRivers();
                this.drawControlLines();
                this.drawInteractionPoints();
                this.context.restore();
            }
        },

        drawRivers: function() {
            this.context.strokeStyle = this.style.curve.color;
            for (var r in this.rivers) {
                this.drawRiver(this.rivers[r]);
                this.context.stroke();
            }
            this.context.setLineDash([]);
        },

        drawControlLines: function() {
            if (this.selectedRiver !== null) {
                this.context.lineWidth = this.style.cpline.width;
                this.context.strokeStyle = this.style.cpline.color;
    
                for(var i = 3; i < this.rivers[this.selectedRiver].length; i += 3) {
                    this.context.beginPath();
                    this.context.moveTo(this.rivers[this.selectedRiver][i - 3].x * this.scale() + this.offset().x, this.rivers[this.selectedRiver][i - 3].y * this.scale() + this.offset().y);
                    this.context.lineTo(this.rivers[this.selectedRiver][i - 2].x * this.scale() + this.offset().x, this.rivers[this.selectedRiver][i - 2].y * this.scale() + this.offset().y);
                    this.context.stroke();
                    this.context.beginPath();
                    this.context.moveTo(this.rivers[this.selectedRiver][i - 1].x * this.scale() + this.offset().x, this.rivers[this.selectedRiver][i - 1].y * this.scale() + this.offset().y);
                    this.context.lineTo(this.rivers[this.selectedRiver][i].x * this.scale() + this.offset().x, this.rivers[this.selectedRiver][i].y * this.scale() + this.offset().y);
                    this.context.stroke();
                }    
            }
        },

        drawInteractionPoints: function() {
            if (this.selectedRiver !== null) {
                this.context.lineWidth = this.style.point.width;
                this.context.strokeStyle = this.style.point.color;
                this.context.fillStyle = this.style.point.fill;
                for (var p in this.rivers[this.selectedRiver]) {
                    this.context.beginPath();
                    this.context.arc(this.rivers[this.selectedRiver][p].x * this.scale() + this.offset().x,
                        this.rivers[this.selectedRiver][p].y * this.scale() + this.offset().y, this.style.point.radius,
                        this.style.point.arc1, this.style.point.arc2, true);
                    this.context.fill();
                    this.context.stroke();
                }
            }
        },

        getPointInSelectedRiver: function(x, y) {
            var dx;
            var dy;
            for (var p in this.rivers[this.selectedRiver]) {
                dx = this.rivers[this.selectedRiver][p].x * this.scale() + this.offset().x - x;
                dy = this.rivers[this.selectedRiver][p].y * this.scale() + this.offset().y - y;
                if ((dx * dx) + (dy * dy) < this.style.point.radius * this.style.point.radius) {
                    this.selectedPoint = p;
                    return;
                }
            }
        },

        getRiverByPointInPath: function(x, y) {
            for (var r in this.rivers) {
                this.context.lineWidth = this.style.curve.width;
                this.drawRiver(this.rivers[r]);
                if (this.context.isPointInStroke(x, y)) {
                    return r;
                }
            }
            return null;
        },

        onMouseDown: function(event, callback) {
            if (this.selectedRiver !== null) {
                this.getPointInSelectedRiver(event.x, event.y);
                if (this.selectedPoint) {
                    this.canvas.style.cursor = 'move';
                }
            }
            if (!this.selectedPoint) {
                var r = this.getRiverByPointInPath(event.x, event.y);
                if (r !== null) {
                    if (this.selectedRiver !== r) {
                        this.selectedRiver = r;
                    }
                    else {
                        this.clearSelectedRiver();
                    }
                }
                else if (this.selectedRiver !== null) {
                    this.addAnchor(event.x, event.y);
                }
                else {
                    this.startRiver(event.x, event.y);
                }
            }
            callback();
        },

        onMouseMove: function(event, callback) {
            if (this.selectedPoint) {
                this.rivers[this.selectedRiver][this.selectedPoint].x += event.movementX / this.scale();
                this.rivers[this.selectedRiver][this.selectedPoint].y += event.movementY / this.scale();
                if (!this.rivers[this.selectedRiver][this.selectedPoint].c) {
                    if (this.selectedPoint - 1 > 0) {
                        this.rivers[this.selectedRiver][+this.selectedPoint - 1].x += event.movementX / this.scale();
                        this.rivers[this.selectedRiver][+this.selectedPoint - 1].y += event.movementY / this.scale();
                    }
                    if (+this.selectedPoint + 1 < this.rivers[this.selectedRiver].length) {
                        this.rivers[this.selectedRiver][+this.selectedPoint + 1].x += event.movementX / this.scale();
                        this.rivers[this.selectedRiver][+this.selectedPoint + 1].y += event.movementY / this.scale();
                    }
                }
                callback();
            }
        },

        onMouseUp: function(event, callback) {
            this.selectedPoint = null;
            this.canvas.style.cursor = 'default';
            callback();
        },

        onRightClick: function(event, callback) {
            this.getPointInSelectedRiver(event.x, event.y);
            if (this.selectedPoint !== null) {
                this.deleteAnchor();
            } else {
                this.insertAnchor(event.x, event.y);
            }
            callback();
        }
    };

    function TerrainController(tiles, canvas, context) {
        this.tiles = tiles;
        this.canvas = canvas;
        this.context = context;
        this.tileWidth = 300;
        this.tileHeight = 150;
        this.points = [{x: 0, y: .5}, {x: .25, y: 0}, {x: .75, y: 0}, {x: 1, y: .5}, {x: .75, y: 1}, {x: .25, y: 1}];
        this.terrain;
        this.selectedTerrain = 1;
        this.m_canvas = document.createElement('canvas');
        this.m_canvas.width = this.tileWidth;
        this.m_canvas.height = this.tileHeight;
        this.m_context = this.m_canvas.getContext('2d');
        this.m2_canvas = document.createElement('canvas');
        this.m2_canvas.width = this.tileWidth;
        this.m2_canvas.height = this.tileHeight;
        this.m2_context = this.m2_canvas.getContext('2d');

        this.initialize();
    }

    TerrainController.prototype = {
        initialize: function() {
            if (!this.terrain || !this.terrain.length) {
                this.terrain = [
                    new Terrain(0, 'Blank', '/images/terrain/blank/', 500, 0),
                    new Terrain(1, 'Ocean', '/images/terrain/ocean/', 0, 0),
                    new Terrain(10, 'Grass', '/images/terrain/grass/', 500, 0),
                    new Terrain(11, 'Forest', '/images/terrain/forest/', 500, 2),
                    new Terrain(12, 'Hills', '/images/terrain/hills/', 500, 0)
                ];
            }
        },

        terrainLoaded: function() {
            var loaded = true;
            this.terrain.forEach(terrain => {
                if (!terrain.loaded()) {
                    loaded = false;
                    return;
                }
            });
            return loaded;
        },

        getTileHeight: function() {
            return this.tileHeight * this.scale();
        },

        getTileWidth: function() {
            return this.tileWidth * this.scale();
        },

        getMappedTerrainArea: function() {
            var xMin, xMax, yMin, yMinEven, yMax, yMaxEven;

            this.tiles.forEach(function(tile) {
                if (xMin == null || xMin > tile.x) {
                    xMin = tile.x;
                }
                if (xMax == null || xMax < tile.x) {
                    xMax = tile.x;
                }
                if (yMin == null || yMin >= tile.y) {
                    yMinEven = !yMinEven || Math.abs(tile.x) % 2 == 1;
                    yMin = tile.y;
                }
                if (yMax == null || yMax <= tile.y) {
                    yMaxEven = !yMaxEven || Math.abs(tile.x) % 2 == 1;
                    yMax = tile.y;
                }
            });
            var width = Math.abs(xMin - xMax) * (.75 * this.getTileWidth()) + this.getTileWidth();
            var height = Math.abs(yMin - yMax) * this.getTileHeight() + this.getTileHeight();
            height -= yMinEven && !yMaxEven ? this.getTileHeight() / 2 : 0;
            
            var xOffset = -xMin * (.75 * this.getTileWidth()) + this.getTileWidth() / 2;
            var yOffset = -yMin * this.getTileHeight() + this.getTileHeight() / 2;
            yOffset -= yMinEven ? this.getTileHeight() / 2 : 0;
            
            return { width: width,
                height: height,
                offset: { x: xOffset, y: yOffset } };
        },

        getTiles: function() {
            return this.tiles.filter(tile => tile.t != 0);
        },

        scale: function() {
            return sessionStorage.getItem('scale');
        },

        offset: function() {
            return {x: +sessionStorage.getItem('xOffset'), y: +sessionStorage.getItem('yOffset')};
        },

        getTerrainById: function(id) {
            return this.terrain.find(item => item.id == id);
        },

        getRandomTerrainFeatureById: function(id) {
            return this.terrain.find(item => item.id == id).images.length - 1;
        },

        setSelectedTerrainId: function(id) {
            this.selectedTerrain = id;
        },

        getSelectedTerrainId: function() {
            return this.selectedTerrain;
        },

        getBounds: function() {
            let tileOffset = this.getTileOffset();
            let totalTiles = this.getTotalTiles();
            return { xMin: 0 - tileOffset.x,
                xMax: totalTiles.x - tileOffset.x,
                yMin: 0 - tileOffset.y,
                yMax: totalTiles.y - tileOffset.y };
        },

        getRandomTerrainFeature: function() {
            if (this.getTerrainById(this.getSelectedTerrainId()).images.length == 1) {
                return null;
            }
            var features = this.getTerrainById(this.getSelectedTerrainId()).images.length - 2;
            var number = Math.round(features * Math.random()) + 1;
            return number;
        },

        changeTerrainTile: function(event, callback) {
            var tileIndex = this.getTileIndex(event.offsetX, event.offsetY);
            if (tileIndex !== undefined) {
                var index = this.tiles.findIndex(tile => tile.x == tileIndex.x && tile.y == tileIndex.y);
                if (index > -1) {
                    if (event.type != 'mousemove' || this.tiles[index].t !== this.getSelectedTerrainId()) {
                        this.tiles[index].t = this.getSelectedTerrainId();
                        this.tiles[index].f = this.getRandomTerrainFeature();
                    }
                } else {
                    this.tiles.push({x: tileIndex.x, y: tileIndex.y, t: this.getSelectedTerrainId(), f: this.getRandomTerrainFeature()});
                }    
            }
            callback();
        },

        getTileIndex: function(x, y) {
            var bounds = this.getBounds();
            for (var xIndex = bounds.xMin; xIndex < bounds.xMax; xIndex++) {
                var xCartesian = this.getCartesianX(xIndex);
                if (xCartesian < x && xCartesian + this.getTileWidth() > x) {
                    for (var yIndex = bounds.yMin; yIndex < bounds.yMax; yIndex++) {
                        var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
                        var yCartesian = this.getCartesianY(yIndex, isEvenRow);
                        if (yCartesian < y && yCartesian + this.getTileHeight() > y) {
                            if (this.pointIntersects(xCartesian, yCartesian)) {
                                return {x: xIndex, y: yIndex};
                            }
                        }
                    }
                }
            }
        },

        pointIntersects: function(xCartesian, yCartesian) {
            this.context.save();
            this.context.beginPath();
            for(var i = 0; i < this.points.length; i++) {
                if (i == 0) {
                    this.context.moveTo(xCartesian + this.points[i].x * this.getTileWidth(), yCartesian + this.points[i].y * this.getTileHeight());
                }
                else {
                    this.context.lineTo(xCartesian + this.points[i].x * this.getTileWidth(), yCartesian + this.points[i].y * this.getTileHeight());
                }
            }

            if (this.context.isPointInPath(event.offsetX, event.offsetY)) {
                return true;
            } else {
                return false;
            }
        },

        getTotalTiles: function() {
            return { x: Math.ceil(this.canvas.width / (.75 * this.getTileWidth())) + 2, y : Math.ceil(this.canvas.height / this.getTileHeight()) + 2 };
        },

        getTileOffset: function() {
            return { x: Math.ceil(this.offset().x / (.75 * this.getTileWidth())), y: Math.ceil(this.offset().y / this.getTileHeight()) };
        },
        
        drawOverlay: function(xIndex, yIndex, zIndex, x, y, i) {
            var tile = this.tiles.filter(tile => tile.x == x && tile.y == y);
            if (tile.length > 0) {
                var terrain = this.getTerrainById(tile[0].t);
                if (terrain.baseZIndex > zIndex) {
                    this.m2_context.drawImage(terrain.overlay[i].element, 0, 0);
                }
            }
        },

        drawOverlays: function(xIndex, yIndex, zIndex) {
            var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
            this.drawOverlay(xIndex, yIndex, zIndex, xIndex, yIndex - 1, 0);
            this.drawOverlay(xIndex, yIndex, zIndex, xIndex - 1, isEvenRow ? yIndex : yIndex - 1 , 1);
            this.drawOverlay(xIndex, yIndex, zIndex, xIndex + 1, isEvenRow ? yIndex : yIndex - 1, 2);
            this.drawOverlay(xIndex, yIndex, zIndex, xIndex - 1, isEvenRow ? yIndex + 1 : yIndex, 3);
            this.drawOverlay(xIndex, yIndex, zIndex, xIndex + 1, isEvenRow ? yIndex + 1 : yIndex, 4);
            this.drawOverlay(xIndex, yIndex, zIndex, xIndex, yIndex + 1, 5);
        },

        drawShore: function(xIndex, yIndex, zIndex, x, y, i) {
            var tile = this.tiles.filter(tile => tile.x == x && tile.y == y);
            if (tile.length > 0) {
                var terrain = this.getTerrainById(tile[0].t);
                var ocean = this.getTerrainById(1);
                if (terrain.id !== 0 && terrain.baseZIndex > zIndex) {
                    this.m_context.globalCompositeOperation = 'lighten';
                    this.m_context.drawImage(ocean.overlay[i].element, 0, 0);
                }
            }
        },

        prepareShores: function(xIndex, yIndex, zIndex) {
            this.m_context.clearRect(0, 0, this.m_canvas.width, this.m_canvas.height);
            this.m_context.save();
            var isEvenRow = Math.abs(xIndex) %2 == 1;
            this.drawShore(xIndex, yIndex, zIndex, xIndex, yIndex - 1, 0);
            this.drawShore(xIndex, yIndex, zIndex, xIndex - 1, isEvenRow ? yIndex : yIndex - 1 , 1);
            this.drawShore(xIndex, yIndex, zIndex, xIndex + 1, isEvenRow ? yIndex : yIndex - 1, 2);
            this.drawShore(xIndex, yIndex, zIndex, xIndex - 1, isEvenRow ? yIndex + 1 : yIndex, 3);
            this.drawShore(xIndex, yIndex, zIndex, xIndex + 1, isEvenRow ? yIndex + 1 : yIndex, 4);
            this.drawShore(xIndex, yIndex, zIndex, xIndex, yIndex + 1, 5);
            this.m_context.restore();
        },
        
        prepareOverlays: function(xIndex, yIndex, zIndex) {
            this.m2_context.clearRect(0, 0, this.m2_canvas.width, this.m2_canvas.height);
            this.m2_context.save();
            this.drawOverlays(xIndex, yIndex, zIndex);
            this.m2_context.globalCompositeOperation = 'destination-in';
            this.m2_context.drawImage(this.m_canvas, 0, 0);
            this.m2_context.globalCompositeOperation = 'multiply';
            this.m2_context.drawImage(this.m_canvas, 0, 0);
            this.m2_context.restore();
        },

        drawShores: function(xIndex, yIndex, zIndex) {
            this.prepareShores(xIndex, yIndex, zIndex);
            this.prepareOverlays(xIndex, yIndex, zIndex);
            var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
            this.context.drawImage(this.m2_canvas, this.getCartesianX(xIndex), this.getCartesianY(yIndex, isEvenRow),
                this.getTileWidth(), this.getTileHeight());
        },

        drawTile: function(xIndex, yIndex) {
            var isEvenRow = Math.abs(xIndex) % 2 == 1; // yes, if it's equal to 1, the first row is index 0, not index 1
            var tile = this.tiles.find(tile => tile.x == xIndex && tile.y == yIndex);
            if (tile) {
                var terrain = this.getTerrainById(tile.t);
                this.context.drawImage(terrain.images[0].element, this.getCartesianX(xIndex), this.getCartesianY(yIndex, isEvenRow),
                    this.getTileWidth(), this.getTileHeight());
                this.drawShores(xIndex, yIndex, terrain.baseZIndex);
                if (tile.f !== null) {
                    var terrainFeature = terrain.images[tile.f].element;
                    var startX = this.getCartesianX(xIndex) - (terrainFeature.width * this.scale() - this.getTileWidth()) / 2;
                    var startY = this.getCartesianY(yIndex, isEvenRow) - (terrainFeature.height * this.scale() - this.getTileHeight()) / 2;
                    this.context.drawImage(terrainFeature, startX, startY,
                        terrainFeature.width * this.scale(), terrainFeature.height * this.scale());
                }
            } else {
                this.context.drawImage(this.getTerrainById(0).images[0].element, this.getCartesianX(xIndex), this.getCartesianY(yIndex, isEvenRow),
                    this.getTileWidth(), this.getTileHeight());
            }
        },

        render: function() {
            var bounds = this.getBounds();
            for (let yIndex = bounds.yMin; yIndex < bounds.yMax; yIndex++) {
                for (let xIndex = Math.abs(bounds.xMin) % 2 == 0 ? bounds.xMin : bounds.xMin + 1; xIndex < bounds.xMax; xIndex += 2) {
                    this.drawTile(xIndex, yIndex);
                }
                for (let xIndex = Math.abs(bounds.xMin) % 2 == 1 ? bounds.xMin : bounds.xMin + 1; xIndex < bounds.xMax; xIndex += 2) {
                    this.drawTile(xIndex, yIndex);
                }
            }
        },
        
        getCartesianX: function(xIndex) {
            return (.75 * this.getTileWidth() * xIndex) + this.offset().x - (this.getTileWidth() / 2);
        },
        
        getCartesianY: function(yIndex, evenRow) {
            var yCartesian = (this.getTileHeight() * yIndex) + this.offset().y - (this.getTileHeight() / 2);
            yCartesian += evenRow ? (this.getTileHeight() / 2) : 0;
            return yCartesian;
        }
    };

    function MapViewModel(mapData) {
        this.id = mapData.id;
        this.name = mapData.name;
        this.canvas;
        this.context;
        sessionStorage.setItem('scale', 1);
        sessionStorage.setItem('xOffset', 0);
        sessionStorage.setItem('yOffset', 0);
        this.activeLayer = 'terrain';
        this.terrainController;
        this.roadController;
        this.riverController;
        this.labelController;
        this.landmarkController;

        this.initialize(mapData.tiles, mapData.roads, mapData.rivers, mapData.labels, mapData.landmarks);
    }

    MapViewModel.prototype = {
        changeActiveLayer: function(layer) {
            document.getElementById(this.activeLayer + 'Layer').classList.remove('active');
            this.activeLayer = layer;
            if (this.activeLayer == 'terrain') {
                document.getElementById('toolbar').style.display = 'block';
            }
            else  {
                document.getElementById('toolbar').style.display = 'none';
            }
            
            if (this.activeLayer == 'landmark') {
                document.getElementById('landmarkToolbar').style.display = 'block';
            }
            else  {
                document.getElementById('landmarkToolbar').style.display = 'none';
            }
            this.roadController.clearSelectedRoad();
            this.riverController.clearSelectedRiver();
            this.labelController.clearSelectedLabel();
            this.landmarkController.clearSelectedLandmark();
            this.render();
            document.getElementById(this.activeLayer + 'Layer').classList.add('active');
        },

        clearSelected: function() {
            if (this.activeLayer == 'road') {
                this.roadController.clearSelectedRoad();
                this.render();
            }
            if (this.activeLayer == 'river') {
                this.riverController.clearSelectedRiver();
                this.render();
            }
            if (this.activeLayer == 'label') {
                this.labelController.clearSelectedLabel();
                this.render();
            }
            if (this.activeLayer == 'landmark') {
                this.landmarkController.clearSelectedLabel();
                this.render();
            }
        },

        deleteSelected: function() {
            if (this.activeLayer == 'road') {
                this.roadController.deleteSelectedRoad();
                this.mapUpdated();
            }
            if (this.activeLayer == 'river') {
                this.riverController.deleteSelectedRiver();
                this.mapUpdated();
            }
            if (this.activeLayer == 'label') {
                this.labelController.deleteSelectedLabel();
                this.mapUpdated();
            }
            if (this.activeLayer == 'landmark') {
                this.landmarkController.deleteSelectedLandmark();
                this.mapUpdated();
            }
        },

        mouseDownPrimary: function(event) {
            if (this.activeLayer == 'road') {
                this.roadController.onMouseDown(event, this.mapUpdated.bind(this));
            }
            if (this.activeLayer == 'river') {
                this.riverController.onMouseDown(event, this.mapUpdated.bind(this));
            }
            if (this.activeLayer == 'label') {
                this.labelController.onMouseDown(event, this.mapUpdated.bind(this));
            }
            if (this.activeLayer == 'landmark') {
                this.landmarkController.onMouseDown(event, this.mapUpdated.bind(this));
            }
        },

        mouseDownSecondary: function() {
        },

        mouseMovePrimary: function(event) {
            if (this.activeLayer == 'terrain') {
                this.terrainController.changeTerrainTile(event, this.mapUpdated.bind(this));
            }
            if (this.activeLayer == 'road') {
                this.roadController.onMouseMove(event, this.render.bind(this));
            }
            if (this.activeLayer == 'river') {
                this.riverController.onMouseMove(event, this.render.bind(this));
            }
            if (this.activeLayer == 'label') {
                this.labelController.onMouseMove(event, this.render.bind(this));
            }
            if (this.activeLayer == 'landmark') {
                this.landmarkController.onMouseMove(event, this.render.bind(this));
            }
        },

        mouseMoveSecondary: function() {
            this.moveView(event.movementX, event.movementY);
        },

        mouseUpPrimary: function(event) {
            if (this.activeLayer == 'road') {
                this.roadController.onMouseUp(event, this.mapUpdated.bind(this));
            }
            if (this.activeLayer == 'river') {
                this.riverController.onMouseUp(event, this.mapUpdated.bind(this));
            }
            if (this.activeLayer == 'label') {
                this.labelController.onMouseUp(event, this.mapUpdated.bind(this));
            }
            if (this.activeLayer == 'landmark') {
                this.landmarkController.onMouseUp(event, this.mapUpdated.bind(this));
            }
        },

        mouseUpSecondary: function() {
        },

        mouseClickPrimary: function(event) {
            if (this.activeLayer == 'terrain') {
                this.terrainController.changeTerrainTile(event, this.mapUpdated.bind(this));
            }
        },

        mouseClickSecondary: function() {
            if (this.activeLayer == 'road') {
                this.roadController.onRightClick(event, this.mapUpdated.bind(this));
            }
            if (this.activeLayer == 'river') {
                this.riverController.onRightClick(event, this.mapUpdated.bind(this));
            }
        },

        moveView: function(x, y) {
            sessionStorage.setItem('xOffset', +sessionStorage.getItem('xOffset') + x);
            sessionStorage.setItem('yOffset', +sessionStorage.getItem('yOffset') + y);
            this.render();
        },

        resizeCanvas: function() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.render();
        },

        mapUpdated: function() {
            this.render();
            tg.saveMap({id: this.id, name: this.name, tiles: this.terrainController.getTiles(),
                roads: this.roadController.getRoads(), rivers: this.riverController.getRivers(),
                labels: this.labelController.getLabels(), landmarks: this.landmarkController.getLandmarks()});
        },

        render: function() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.terrainController.render();
            this.riverController.render();
            this.roadController.render();
            this.labelController.render();
            this.landmarkController.render();
        },

        zoomIn: function() {
            sessionStorage.setItem('scale', Math.min(+sessionStorage.getItem('scale') + .05, 1));
            this.render();
        },

        zoomOut: function() {
            sessionStorage.setItem('scale', Math.max(+sessionStorage.getItem('scale') - .05, .3));
            this.render();
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
            document.onkeydown = (event) => {
                switch (event.keyCode) {
                case 27:
                    this.clearSelected();
                    break;
                case 46:
                    this.deleteSelected();
                    break;
                case 37:
                    this.moveView(5, 0);
                    break;
                case 38:
                    this.moveView(0, 5);
                    break;
                case 39:
                    this.moveView(-5, 0);
                    break;
                case 40:
                    this.moveView(0, -5);
                    break;
                case 109:
                    this.zoomOut();
                    break;
                case 107:
                    this.zoomIn();
                    break;
                }
            };
        },

        initialize: function(tiles, roads, rivers, labels, landmarks) {
            var self = this;
            var tulpagraphyContainer = document.getElementById('tulpagraphy');
            this.canvas = document.createElement('canvas');
            tulpagraphyContainer.appendChild(this.canvas);
            this.context = this.canvas.getContext('2d');
            var toolbar = document.createElement('div');
            toolbar.setAttribute('id', 'toolbar');
            toolbar.setAttribute('class', 'toolbar');
            this.terrainController = new TerrainController(tiles, this.canvas, this.context);
            this.roadController = new RoadController(roads, this.canvas, this.context);
            this.riverController = new RiverController(rivers, this.canvas, this.context);
            this.labelController = new LabelController(labels, this.canvas, this.context);
            this.landmarkController = new LandmarkController(landmarks, this.canvas, this.context);
            this.terrainController.terrain.forEach(function(item) {
                var tool = document.createElement('img');
                tool.setAttribute('src', item.imageDirectory + 'tool.png');
                tool.setAttribute('title', item.name);
                tool.setAttribute('alt', item.name);
                tool.addEventListener('click', self.terrainController.setSelectedTerrainId.bind(self.terrainController, item.id));
                toolbar.appendChild(tool);
            });
            tulpagraphyContainer.appendChild(toolbar);
            
            var landmarkToolbar = document.createElement('div');
            landmarkToolbar.setAttribute('id', 'landmarkToolbar');
            landmarkToolbar.setAttribute('class', 'toolbar');
            this.landmarkController.landmarkOptions.forEach(function(item) {
                var tool = document.createElement('img');
                tool.setAttribute('src', item.imagePath);
                tool.setAttribute('title', item.name);
                tool.setAttribute('alt', item.name);
                tool.addEventListener('click', self.landmarkController.setSelectedLandmarkById.bind(self.landmarkController, item.id));
                landmarkToolbar.appendChild(tool);
            });
            tulpagraphyContainer.appendChild(landmarkToolbar);
            document.getElementById('landmarkToolbar').style.display = 'none';


            var labelToolbar = document.createElement('div');
            labelToolbar.setAttribute('id', 'labelToolbar');
            labelToolbar.setAttribute('class', 'toolbar');
            var text = document.createElement('input');
            text.setAttribute('type', 'text');
            text.setAttribute('id', 'labelText');
            text.addEventListener('input', this.labelController.updateLabelText.bind(this.labelController, this.mapUpdated.bind(this)));
            labelToolbar.appendChild(text);

            var fontSize = document.createElement('select');
            fontSize.setAttribute('id', 'fontSize');
            for (let i = 16; i <=60; i+=4) {
                var sizeOption = document.createElement('option');
                sizeOption.text = i;
                fontSize.add(sizeOption);
            }
            fontSize.addEventListener('change', this.labelController.updateFontSize.bind(this.labelController, this.mapUpdated.bind(this)));
            labelToolbar.appendChild(fontSize);
            var fonts = document.createElement('select');
            fonts.setAttribute('id', 'fonts');
            var fontNames = [{text: "Arial", value: "Arial"}, {text: "Arial Black", value: "'Arial Black'"}, {text: "Comic Sans MS", value: "'Comic Sans MS'"},
                {text: "Courier New", value: "'Courier New'"}, {text: "Helvetica", value: "helvetica"}, {text: "Impact", value: "hoge,impact"}, 
                {text: "Times New Roman", value: "'Times New Roman'"}, {text: "Trebuchet MS", value: "'Trebuchet MS'"}, {text: "Verdana", value: "Verdana"}]
            for (let i = 0; i < fontNames.length; i++) {
                var fontOption = document.createElement('option');
                fontOption.value = fontNames[i].value;
                fontOption.text = fontNames[i].text;
                fonts.add(fontOption);
            }
            fonts.addEventListener('change', this.labelController.updateFont.bind(this.labelController, this.mapUpdated.bind(this)));
            labelToolbar.appendChild(fonts);

            var colorPicker = document.createElement('input');
            colorPicker.setAttribute('value', '#000000');
            colorPicker.setAttribute('type', 'color');
            colorPicker.setAttribute('id', 'colorPicker');
            labelToolbar.appendChild(colorPicker);
            colorPicker.addEventListener('change', this.labelController.updateFontColor.bind(this.labelController, this.mapUpdated.bind(this)));

            var boldLabel = document.createElement('b');
            boldLabel.innerText = 'B';
            labelToolbar.appendChild(boldLabel);
            var boldCheckbox = document.createElement('input');
            boldCheckbox.setAttribute('type', 'checkbox');
            boldCheckbox.setAttribute('id', 'bold');
            labelToolbar.appendChild(boldCheckbox);
            boldCheckbox.addEventListener('click', this.labelController.updateBold.bind(this.labelController, this.mapUpdated.bind(this)));

            var italicLabel = document.createElement('i');
            italicLabel.innerText = 'I';
            labelToolbar.appendChild(italicLabel);
            var italicCheckbox = document.createElement('input');
            italicCheckbox.setAttribute('type', 'checkbox');
            italicCheckbox.setAttribute('id', 'italic');
            labelToolbar.appendChild(italicCheckbox);
            italicCheckbox.addEventListener('click', this.labelController.updateItalic.bind(this.labelController, this.mapUpdated.bind(this)));

            tulpagraphyContainer.appendChild(labelToolbar);
            document.getElementById('labelToolbar').style.display = 'none';

            this.bindActions();

            document.getElementById('terrainLayer').classList.add('active');

            var loader = setInterval(() => {
                if (this.terrainController.terrainLoaded()) {
                    clearInterval(loader);
                    this.resizeCanvas();
                }
            }, 100);
        }
    };

    function MapExportViewModel(mapData) {
        this.id = mapData.id;
        this.name = mapData.name;
        this.canvas;
        this.context;
        this.terrainController;
        this.roadController;
        this.riverController;
        this.labelController;
        this.landmarkController;

        this.initialize(mapData.tiles, mapData.roads, mapData.rivers, mapData.labels, mapData.landmarks);
    }

    MapExportViewModel.prototype = {
        offset: function(x, y) {
            sessionStorage.setItem('xOffset', +sessionStorage.getItem('xOffset') + x);
            sessionStorage.setItem('yOffset', +sessionStorage.getItem('yOffset') + y);
        },

        render: function() {
            var terrainArea = this.terrainController.getMappedTerrainArea();
            this.canvas.width = terrainArea.width;
            this.canvas.height = terrainArea.height;
            this.offset(terrainArea.offset.x, terrainArea.offset.y);
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.terrainController.render();
            this.riverController.render();
            this.roadController.render();
            this.labelController.render();
            this.landmarkController.render();
        },

        initialize: function(tiles, roads, rivers, labels, landmarks) {
            var tulpagraphyContainer = document.getElementById('tulpagraphy');
            this.canvas = document.createElement('canvas');
            tulpagraphyContainer.appendChild(this.canvas);
            this.context = this.canvas.getContext('2d');
            this.terrainController = new TerrainController(tiles, this.canvas, this.context);
            this.roadController = new RoadController(roads, this.canvas, this.context);
            this.riverController = new RiverController(rivers, this.canvas, this.context);
            this.labelController = new LabelController(labels, this.canvas, this.context);
            this.landmarkController = new LandmarkController(landmarks, this.canvas, this.context);
            var loader = setInterval(() => {
                if (this.terrainController.terrainLoaded()) {
                    clearInterval(loader);
                    this.render();
                }
            }, 100);
        }
    };

    function Terrain(id, name, imageDirectory, zIndex, number) {
        this.id = id;
        this.name = name;
        this.imageDirectory = imageDirectory;
        this.baseZIndex = zIndex;
        this.overlay = [new MapImage(imageDirectory + 'n.png'), new MapImage(imageDirectory + 'nw.png'), new MapImage(imageDirectory + 'ne.png'),
            new MapImage(imageDirectory + 'sw.png'), new MapImage(imageDirectory + 'se.png'), new MapImage(imageDirectory + 's.png')];
        this.images = [];

        for (var i = 0; i <= number; i++) {
            this.images.push(new MapImage(imageDirectory + i + '.png'));
        }
    }

    Terrain.prototype = {
        loaded: function() {
            let loaded = true;
            this.images.forEach(image => {
                if (!image.loaded) {
                    loaded = false;
                    return;
                }
            });
            this.overlay.forEach(image => {
                if (!image.loaded) {
                    loaded = false;
                    return;
                }
            });
            return loaded;
        }
    };

    function Landmark(id, name, imagePath) {
        this.id = id;
        this.name = name;
        this.imagePath = imagePath;
        this.image = new MapImage(imagePath);
    }

    Landmark.prototype = {
        loaded: function() {
            return this.image.loaded;
        }
    };

    function MapImage(url) {
        this.loaded = false;
        this.element = new Image();
        this.element.src = url;
        this.element.addEventListener('load', this.onLoaded.bind(this));
    }

    MapImage.prototype = {
        onLoaded: function() {
            this.loaded = true;
        }
    };

    function Tulpagraphy() {
        this.mapViewModel;
    }

    Tulpagraphy.prototype = {
        initializeMap: function(id) {
            this.mapViewModel = new MapViewModel(this.getMapById(id));
        },

        exportMap: function(id) {
            new MapExportViewModel(this.getMapById(id));
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
            localStorage.setItem(id, JSON.stringify({id: id, name: 'untitled', tiles: [], roads: [], rivers:[], labels:[], landmarks:[]}));
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
            localStorage.clear();
        }
    };
    return new Tulpagraphy();
})();