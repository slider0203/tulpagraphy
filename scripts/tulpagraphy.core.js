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
        },

        redirect: function(url) {
            url = this._sanitizeRedirectUrl(url, _.rest(arguments));

            window.location.href = url;
        },

        _sanitizeRedirectUrl: function(url, params) {
            if (!url) {
                url = '';
            }
            if (url.indexOf('*') == 0) {
                if (url.match( /\*map-index/ )) {
                    url = '/Map';
                }
                if (url.match( /\*map-create/ )) {
                    url = '/Map/Create';
                }
                if (url.match( /\*map-edit/ )) {
                    url = '/Map/Edit/' + params[0];
                }
            }

            return url;
        }
    };
    return new Tulpagraphy();
})(_);