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

function editMap() {
    window.location = '/views/edit-map.html?id=' + getId();
}

tg.exportMap(getId());