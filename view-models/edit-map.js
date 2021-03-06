function getId() {

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };
    
    var id = parseInt(getUrlParameter('id'));
    return id;
};

function exportMap() {
    window.location = '/views/export-map.html?id=' + getId();
}

tg.initializeMap(getId());