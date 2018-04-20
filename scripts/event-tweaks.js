$(function() {
    var leftButtonDown = false;

    window.tweakMouseEvent = function(e) {

        // If left button is not set, set which to 0
        // This indicates no buttons pressed
        if (e.which === 1 && !leftButtonDown) e.which = 0;
    };
    $(document).mousedown(function(e) {
        // Left mouse button was pressed, set flag
        if (e.which === 1) leftButtonDown = true;
    });

    $(document).mouseup(function(e) {
        // Left mouse button was released, clear flag
        if (e.which === 1) leftButtonDown = false;
    });
});