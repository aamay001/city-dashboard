'use strict';

const CD_GOOGLE_APIS = {
    GEOCODING : { 
        url : 'https://maps.googleapis.com/maps/api/geocode/json',
        key : 'AIzaSyDuOUdcwsu_byQwsFv5b6lrF3u9BBNXDJI'        
    }
};

const CD_ACCUWEATHER_API = {
    citySearchUrl : 'https://dataservice.accuweather.com/locations/v1/cities/search',
    foreCastUrl : 'https://dataservice.accuweather.com/forecasts/v1/daily/5day/',
    key : '5vLVDKU5bTzVtFXRMHbQJ4arNfTBsb9a'
}

const CD_UNSPLASH_API = {
    url : 'https://api.unsplash.com/photos/random',
    client_id : '4cfdde8d5a5a196a85132329084298f8ff30334826ae24b7f0d38a6d5397e238'
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
        contentAreaContainer : '.js-cd-content-area-container',
        serachForm : "#cd-search-form"
    };

$(onReady);

function onReady() {

    bindUserInput();    
    cdAutcomplete.addListener('place_changed', onPlaceChanged);
    getUserLocation();
}

function onPlaceChanged() {
    cdUserLocation.city = cdAutcomplete.getPlace();    
    console.log(cdUserLocation.city);
}

function bindUserInput() {
    $(CD_HTML.serachForm).on('submit', onSearchSubmit);

    cdAutcomplete = new google.maps.places.Autocomplete(
        document.getElementById(CD_HTML.searchInput),
        { types : ['(cities)'] }
    );
}

function onSearchSubmit(event) {
    event.preventDefault();
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

function showDashboard() {
    
    $(CD_HTML.searchContainer).hide();
    $(CD_HTML.banner).hide();
    $(CD_HTML.navBarText).html(cdUserLocation.city);
    getWeatherData(); 
    setMapBackground();
    $(window).on('resize', setMapBackground);    
}

function setMapBackground() {
    let params = {
        client_id : CD_UNSPLASH_API.client_id,
        query : 'scenery'
    }    
    
    $.getJSON(CD_UNSPLASH_API.url, params)
        .then(function(res){
            if ( res.urls) {
                cdUserLocation.background = res.urls.full;
                $('body').css('background-image', 'url(' + res.urls.full + ')');
                $(CD_HTML.mapBackground).fadeIn('slow');
            }
        })
        .fail(function(err) {
            console.log(err);
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
function getUserLocation() {
    let geolocationOps = {
            enableHighAccuracy: true, 
            maximumAge        : 30000, 
            timeout           : 27000
        };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition( getUserLocality, handleError, geolocationOps);        
    } else {
        // use form to have user enter location
        showSearch();
    }
}

function getUserLocality(position) {
    cdUserLocation.longitude = position.coords.longitude;
    cdUserLocation.latitude = position.coords.latitude;    

    let params = {
                    latlng : cdUserLocation.latitude + ',' + cdUserLocation.longitude,
                    key : CD_GOOGLE_APIS.GEOCODING.key
                 }
    $.getJSON(CD_GOOGLE_APIS.GEOCODING.url, params)
        .then(function(res){
            console.log(res);
            if ( res.results)    {
                let cities = res.results.map(
                    function(item) {
                        if ( item.formatted_address && "locality" === item.types[0] )
                            return item.formatted_address;
                    }).filter(
                    function(item) { 
                        if ( item ) return item;
                    });

                cdUserLocation.city = cities[0];    
                console.log(cdUserLocation);
                console.log( `User location updated: ${cdUserLocation.city}` );
                showDashboard();                

            } else {
                console.log('User locality could not be determined.');
            }
        });
}

function handleError(err){
    console.log(err);

    if ( err.code === 1)
        showSearch();
}

///////////////////////////////////////////////////////////////////////////////
// Weather
///////////////////////////////////////////////////////////////////////////////
function getWeatherData() {
    let params = {
        q : cdUserLocation.city,
        apikey : CD_ACCUWEATHER_API.key
    }

    $.getJSON(CD_ACCUWEATHER_API.citySearchUrl, params)
        .then( getWeatherLocationKeySuccess )
        .catch( handleError );
}

function getWeatherLocationKeySuccess(res) {
    let weatherLocationKey = res[0].Key;

    let params = {
        apikey : CD_ACCUWEATHER_API.key
    }

    $.getJSON(CD_ACCUWEATHER_API.foreCastUrl + weatherLocationKey, params )
        .then( function(res){

            cdUserLocation.weather = res.DailyForecasts;
            cdUserLocation.weather.pop();
            console.log(cdUserLocation.weather);
            console.log(`User location updated: Temp ${cdUserLocation.weather[0].Temperature.Maximum.Value}°F`);
            showWeatherInformation();
        })
        .catch(function(err){
            console.log('Error getting weather forecast.');
            console.log(err.message);
        });
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
    let count = 0;
    console.log(cdUserLocation.weather);
    cdUserLocation.weather.map(
        function(item){

            item.Day.Icon = item.Day.Icon <= 9 ? '0' + item.Day.Icon : item.Day.Icon;

            element.append(
                `<div class="col s12 m6 l6 xl3">
                    <div class="card blue lighten-4 grey-text text-darken-4">
                        <div class="card-content">
                        <img src="https://developer.accuweather.com/sites/default/files/${item.Day.Icon}-s.png" alt='Icon for current weather.' style="float:right"/>
                        <span class="card-title">${item.Temperature.Maximum.Value}°F</span>
                        <i>${item.Day.IconPhrase}</i><br>
                        <sub><i class="fa fa-arrow-down" aria-hidden="true"></i> low: ${item.Temperature.Minimum.Value}°F <i class="fa fa-arrow-up" aria-hidden="true"></i> high: ${item.Temperature.Maximum.Value}°F</sub>
                        </div>
                        <div class="card-action grey lighten-5">
                            ${getFormattedDate(item.EpochDate)}
                        </div>
                    </div>
                </div>`
            )
        }
    );
    return element;
}