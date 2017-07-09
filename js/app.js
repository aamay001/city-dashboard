'use strict';

const CD_GOOGLE_APIS = {
    GEOCODING : { 
        url : 'https://maps.googleapis.com/maps/api/geocode/json',
        key : 'AIzaSyDuOUdcwsu_byQwsFv5b6lrF3u9BBNXDJI'        
    },
    MAPS_EMBED : {
        url : 'https://www.google.com/maps/embed/v1/place',
        key : 'AIzaSyBmnWXOGe8XT8YMAvkIK_VxCOEfcRVyHOo'
    }
};

var cdUserLocation = {
        longitude : undefined,
        latitude : undefined,
        city : undefined,
        map : undefined
    };


const CD_HTML = {
        navBar : '.js-cd-navbar',
        navBarText : '.js-cd-navbar h1',
        banner : '.js-cd-main-header',
        bannerHeader : '.js-cd-main-header h2',
        bannerSubtext : '.js-cd-main-header i',
        searchContainer : '.js-cd-search-container',
        mapBackground : 'div.js-cd-map-background'
    };


$(onReady);

function onReady() {
    let locationPromise = new Promise( (resolve, reject ) => {
        getUserLocation(resolve, reject);
    });

    locationPromise.then(showDashboard).catch(showSearch); 
}

///////////////////////////////////////////////////////////////////////////////
// DOM Manip
///////////////////////////////////////////////////////////////////////////////
function showSearch() {
    $(CD_HTML.bannerSubtext).hide();
    $(CD_HTML.bannerHeader).text("Enter you city's name.")
    $(CD_HTML.searchContainer).fadeIn('slow');
}

function showDashboard(res) {
    $(CD_HTML.banner).fadeOut();
    $(CD_HTML.navBarText).text(res.city);
    setBackgroundImage();
}

function setBackgroundImage() {
    let params = {                   
                    q : cdUserLocation.city[0],
                    zoom : 12,
                    key : CD_GOOGLE_APIS.MAPS_EMBED.key
                 }
    let src = CD_GOOGLE_APIS.MAPS_EMBED.url + '?' + $.param(params);
    console.log(src);
    $(CD_HTML.mapBackground).html(
        `<iframe src="${src}" 
                 width="${$(window).width()}" 
                 height="${$(window).height() - $(CD_HTML.navBar).height()}" ></iframe>`
    );
    $(CD_HTML.mapBackground).fadeIn('slow');
}

///////////////////////////////////////////////////////////////////////////////
// Geo Location
///////////////////////////////////////////////////////////////////////////////
function getUserLocation(resolve, reject) {
    let geolocationOps = {
            enableHighAccuracy: true, 
            maximumAge        : 30000, 
            timeout           : 27000
        };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position){ getPositionSuccess(position, resolve, reject) }, 
            function(err) { getPositionError(err, reject) }, geolocationOps);        
    }
}

function getPositionSuccess(position, resolve, reject) {
    cdUserLocation.longitude = position.coords.longitude;
    cdUserLocation.latitude = position.coords.latitude;    
    console.log( `User location updated: ${cdUserLocation.longitude}, ${cdUserLocation.latitude}` );
    getUserLocality(resolve, reject);
}

function getPositionError(err, reject) {
    console.log("Error getting user's location.");
    console.log(err.message);
    reject("Unable to get user's location.");
}

function getUserLocality( resolve, reject ) {
    let params = {
                    latlng : cdUserLocation.latitude + ',' + cdUserLocation.longitude,
                    key : CD_GOOGLE_APIS.GEOCODING.key
                 }
    $.getJSON(CD_GOOGLE_APIS.GEOCODING.url, params)
        .then( function(res) { getLocalitySuccess(res, resolve) })
        .fail( function(err) { getLocalityError(err, reject) }); 
}

function getLocalitySuccess(res, resolve) {
    let cities = res.results.map(
        function(item) {
            if ( item.formatted_address && "locality" === item.types[0] )
                return item.formatted_address;
        }).filter(
        function(item) { 
            if ( item ) return item;
        });
    
    cdUserLocation.city = cities;    
    console.log( `User location updated: ${cdUserLocation.city}` );
    resolve(cdUserLocation);
}

function getLocalityError(err, reject) {
    console.log('Error talking to Google Geocoding API.');
    console.log(err.message);
    reject("Unable to get user's locality.");
}




