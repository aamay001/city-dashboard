'use strict';

const CD_GOOGLE_APIS = {
    GEOCODING : { 
        url : 'https://maps.googleapis.com/maps/api/geocode/json',
        key : 'AIzaSyDuOUdcwsu_byQwsFv5b6lrF3u9BBNXDJI'        
    },
    MAPS_EMBED : {
        url : 'https://www.google.com/maps/embed/v1/streetview',
        key : 'AIzaSyBmnWXOGe8XT8YMAvkIK_VxCOEfcRVyHOo'
    }
};

const CD_OPEN_WEATHER_API = {
    url : 'http://api.openweathermap.org/data/2.5/forecast/daily',
    key : 'add0c60b285e82414e6645f990831a9e'
};

const CD_UNSPLASH_API = {
    url : 'https://api.unsplash.com/photos/random',
    client_id : 'a9698e9b2689360008f762c5b92efb67c9c33f9141fc65ec81571a08a80ecf30'
}

var cdAutcomplete = {};
var cdUserLocation = {
        longitude : undefined,
        latitude : undefined,
        city : undefined,
        weather : undefined,
        background : undefined
    };


const CD_HTML = {
        navBar : '.js-cd-navbar',
        navBarText : '.js-cd-navbar h1',
        banner : '.js-cd-main-header',
        bannerHeader : '.js-cd-main-header h2',
        bannerSubtext : '.js-cd-main-header em',
        searchContainer : '.js-cd-search-container',
        searchInput: 'cd-search-input',
        mapBackground : 'div.js-cd-map-background',
        contentAreaContainer : '.js-cd-content-area-container'
    };


$(onReady);

function onReady() {

    bindUserInput();    

    cdAutcomplete.addListener('place_changed', onPlaceChanged);

    let locationPromise = new Promise( (resolve, reject ) => {
        getUserLocation(resolve, reject);
    });


    locationPromise.then(showDashboard).catch(showSearch); 
}

function onPlaceChanged() {
    var place = cdAutcomplete.getPlace();    
    console.log(place);
}

function bindUserInput() {
    $("#" + CD_HTML.searchInput).keydown(onUserKeyDown);

    cdAutcomplete = new google.maps.places.Autocomplete(
        document.getElementById(CD_HTML.searchInput),
        { types : ['(cities)'] }
    );
}

function onUserKeyDown(event) {

    if ( event.which === 13) {
        event.preventDefault();
        onSearchSubmit();
    }
}

function onSearchSubmit() {
    cdUserLocation.city = [ $("#" + CD_HTML.searchInput).val() ];
    showDashboard(cdUserLocation);
}

///////////////////////////////////////////////////////////////////////////////
// DOM Manip
///////////////////////////////////////////////////////////////////////////////
function showSearch() {
    $(CD_HTML.bannerSubtext).hide();
    $(CD_HTML.bannerHeader).text("Enter your city's name.")
    $(CD_HTML.searchContainer).fadeIn('slow');
}

function showDashboard(res) {
    $(CD_HTML.searchContainer).hide();
    $(CD_HTML.banner).hide();
    $(CD_HTML.navBarText).html(res.city);    
    setMapBackground();
    $(window).on('resize', setMapBackground);
    getWeather().then(showWeatherInformation).catch(showWeatherError);
}

function setMapBackground() {
    let params = {
        client_id : CD_UNSPLASH_API.client_id,
        query : 'scenery'
    }
    $.getJSON(CD_UNSPLASH_API.url, params)
        .then(function(res){
            if ( res.urls) {
                $('body').css('background-image', 'url(' + res.urls.full + ')');
                $(CD_HTML.mapBackground).fadeIn('slow');
            }
        })
        .fail(function(err) {

        });
}

function showWeatherInformation(res) { 
    let weatherDataHTML = getWeatherDataHTML();
    $(CD_HTML.contentAreaContainer).append(`
            <div class="row">
                <div class="col s12 m8 l6">
                    <div class="card-content grey-text text-lighten-5">
                        <h4>Weather Forecast</h4>
                    </div>                  
                </div>
            </div>`);
    $(CD_HTML.contentAreaContainer).append(weatherDataHTML);
}

function showWeatherError(err) {
    console.log('Error getting weather.');
    console.log(err.message);
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

    else
        reject('Geolocation unavailable.');
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

function getUserLocality(resolve, reject) {
    let params = {
                    latlng : cdUserLocation.latitude + ',' + cdUserLocation.longitude,
                    key : CD_GOOGLE_APIS.GEOCODING.key
                 }
    $.getJSON(CD_GOOGLE_APIS.GEOCODING.url, params)
        .then( function(res) { getLocalitySuccess(res, resolve, reject) })
        .fail( function(err) { getLocalityError(err, reject) }); 
}

function getLocalitySuccess(res, resolve, reject) {
    if ( res.results)
    {
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
    } else {
        console.log('User locality could not be determined.');
        reject('The results returned by Google were not determinate.');
    }
}

function getLocalityError(err, reject) {
    console.log('Error talking to Google Geocoding API.');
    console.log(err.message);
    reject("Unable to get user's locality.");
}

///////////////////////////////////////////////////////////////////////////////
// Weather
///////////////////////////////////////////////////////////////////////////////
function getWeather() {
    let weather = new Promise( (resolve, reject) =>
        getWeatherData(resolve, reject) 
    );

    return weather;
}

function getWeatherData(resolve, reject) {
    let params = {
        q : cdUserLocation.city[0],
        units : 'imperial',
        cnt : 4,
        appid : CD_OPEN_WEATHER_API.key
    }

    $.getJSON(CD_OPEN_WEATHER_API.url, params)
        .then( function(res) { getWeatherDataSuccess(res, resolve) })
        .fail( function(err) { getWeatherDataError(err, reject )});
}

function getWeatherDataSuccess(res, resolve) {
    cdUserLocation.weather = res.list;
    console.log(`User location updated: Temp ${cdUserLocation.weather[0].temp.day}°F`);
    resolve(cdUserLocation.weather);
}

function getWeatherDataError(err, reject ) {
    console.log('Error talking to OpenWeather.');
    console.log(err.message);
    reject('Unable to get weather data.');
}

function getFormattedDate(dtVal) {
    let weekday = new Array(7);
        weekday[0] =  "Sunday";
        weekday[1] = "Monday";
        weekday[2] = "Tuesday";
        weekday[3] = "Wednesday";
        weekday[4] = "Thursday";
        weekday[5] = "Friday";
        weekday[6] = "Saturday";
    let dt = new Date(dtVal * 1000);
    let dtString = `${weekday[dt.getDay()]}, ${dt.getMonth()}/${dt.getDate()}/${dt.getFullYear()}`; 
    return dtString;
}

function getWeatherDataHTML() {
    let phi = 'https://materializecss.com/images/sample-1.jpg';
    let element = $('<div class="row"></div>');
    cdUserLocation.weather.map(
        function(item){
            element.append(
                `<div class="col s12 m6 l6 xl3">
                    <div class="card blue lighten-4 grey-text text-darken-4">
                        <div class="card-content">
                        <img src="https://openweathermap.org/img/w/${item.weather[0].icon}.png" alt='Icon for current weather.' style="float:right"/>
                        <span class="card-title">${item.temp.day}°F</span>
                        <i>${item.weather[0].description}</i><br>
                        <sub><i class="fa fa-arrow-down" aria-hidden="true"></i> low: ${item.temp.min}°F <i class="fa fa-arrow-up" aria-hidden="true"></i> high: ${item.temp.max}°F</sub>
                        </div>
                        <div class="card-action grey lighten-5">
                            ${getFormattedDate(item.dt)}
                        </div>
                    </div>
                </div>`
            )
        }
    );
    return element;
}