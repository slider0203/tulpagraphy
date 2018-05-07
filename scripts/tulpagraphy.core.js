/* File Created: September 11, 2012 */
tg = (function(_) {

    function ElementConstructor() {
    };

    ElementConstructor.prototype = {
        svg: function (tag, attrs) {
            var element = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (var attr in attrs)
                element.setAttribute(attr, attrs[attr]);
            return element;
        },
        element: function (tag, attrs) {
            var element = document.createElement(tag);
            for (var attr in attrs)
                element.setAttribute(attr, attrs[attr]);
            return element;
        },
        canvas: function (attrs) {
            var element = document.createElement('canvas');
            for (var attr in attrs)
                element.setAttribute(attr, attrs[attr]);
            element.setAttribute('data-bind', "attr: { height: height().pixelSize() + 'px', width: width().pixelSize() + 'px' }");
            return element;
        }
    };

    function Tulpagraphy() {
        var self = this;
        self.elementConstructor = new ElementConstructor();

        self.pageModels = { };
        self.config = { };
        self.factories = { };

        self.make = {
            svgElement: self.elementConstructor.svg,
            canvasElement: self.elementConstructor.canvas,
            element: self.elementConstructor.element
        };
    };

    Tulpagraphy.prototype = {
        log: function() {
            if (window.console) {
                window.console.log(Array.prototype.slice.call(arguments));
            }
        }
    };
    return new Tulpagraphy();
})(_);