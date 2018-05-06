/* File Created: September 11, 2012 */
tg = (function(_) {

    function ElementConstructor() {
    };

    ElementConstructor.prototype = {
        svg: function(tag, attrs) {
            var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (var k in attrs)
                el.setAttribute(k, attrs[k]);
            return el;
        }
    };

    function Tulpagraphy() {
        var self = this;
        self.elementConstructor = new ElementConstructor();

        self.pageModels = { };
        self.config = { };
        self.factories = { };

        self.make = {
            svgElement: self.elementConstructor.svg
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