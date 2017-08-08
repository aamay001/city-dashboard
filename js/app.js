'use strict';

const CD_GOOGLE_APIS = {
    GEOCODING : { 
        url : 'https://maps.googleapis.com/maps/api/geocode/json',
        key : 'AIzaSyDuOUdcwsu_byQwsFv5b6lrF3u9BBNXDJI'        
    }
};

const CD_ACCUWEATHER_API = {
    citySearchUrl : 'https://dataservice.accuweather.com/locations/v1/geoposition/search',
    foreCastUrl : 'https://dataservice.accuweather.com/forecasts/v1/daily/5day/',
    key : 'sR19s15XEmiAuwGfXgN6g2dWU6KEG4Lu'
};

const CD_UNSPLASH_API = {
    url : 'https://api.unsplash.com/photos/random',
    client_id : '4cfdde8d5a5a196a85132329084298f8ff30334826ae24b7f0d38a6d5397e238',
    attribUTMParam : '?utm_source=city-dashboard&utm_medium=referral&utm_campaign=api-credit'
};

const CD_FOURSQAURE_API = {
    url : 'https://api.foursquare.com/v2/venues/search',
    client_id : 'SVUR45DN1FM4CM2PWZEJKX01VVBDTTP1B231WHQKTFJIL2B1',
    client_secret : 'JKLV2WDLXYM3EFWLZYZO512U0QGY31VDZ0DCRLZ05XO3D4WB'
};

var cdAutcomplete = {};
var cdUserLocation = {
        longitude : undefined,
        latitude : undefined,
        city : undefined,
        background : undefined
    };

const CD_HTML = {
        navBar : '.js-cd-navbar',
        navBarText : '.js-cd-navbar h1',
        changeCityButton : '.js-cd-navbar li',
        infoPanel: '.js-cd-info-panel',
        goButton : '.js-cd-go-button',
        searchButton : '.js-cd-search-button',
        banner : '.js-cd-main-header',
        bannerHeader : '.js-cd-main-header h2',
        bannerParagraphs : '.js-cd-main-header p',
        bannerSubtext : '.js-cd-main-header em',
        searchContainer : '.js-cd-search-container',
        searchInput: 'cd-search-input',
        contentAreaContainer : '.js-cd-content-area-container',
        serachForm : "#cd-search-form",
        loader: '.js-cd-loader',
        photoAttrib : '.js-cd-photo-attribution',
        locaFoodMap : '#cd-localfood-map'
    };

$(onReady);

function onReady() {
    bindUserInput();    
    cdAutcomplete.addListener('place_changed', onPlaceChanged);

    if(sessionStorage.getItem('newSearch')) {
        sessionStorage.removeItem('newSearch');
        showSearch();
    }
}

function bindUserInput() {
    $(CD_HTML.goButton).on('click', getUserLocation);
    $(CD_HTML.searchButton).on('click', showSearch);
    $(CD_HTML.serachForm).on('submit', onSearchSubmit);
    cdAutcomplete = new google.maps.places.Autocomplete(
        document.getElementById(CD_HTML.searchInput),
        { types : ['(cities)'] }
    );
}

function onPlaceChanged() {
    $('#' + CD_HTML.searchInput).removeClass('invalid');
    cdUserLocation.city = cdAutcomplete.getPlace();
    
    if ( cdUserLocation.city.geometry ) {
        cdUserLocation.latitude = cdUserLocation.city.geometry.location.lat();
        cdUserLocation.longitude = cdUserLocation.city.geometry.location.lng();
        console.log(cdUserLocation);
        processSelection();
    }
    else {
        handleError('Bad input.');
        $('#' + CD_HTML.searchInput).addClass('invalid');
    }
}

function onSearchSubmit(event) {
    // Prevent default only if user hit the 
    // enter key/submit the form and do nothing.
    if(event) {
        event.preventDefault();
        return;
    }    
}

function processSelection(){    
    $(CD_HTML.loader).show();    
    if (cdUserLocation.city.id) {
        cdUserLocation.city = [ $("#" + CD_HTML.searchInput).val() ];
        showDashboard(cdUserLocation);
    } else {
        console.log('Bad input.');
        $('#' + CD_HTML.searchInput).addClass('invalid');
        $(CD_HTML.loader).hide(); 
    }
}

function newSearch(){
    sessionStorage.setItem('newSearch', true);
    window.location = './';
}

///////////////////////////////////////////////////////////////////////////////
// DOM Manip
///////////////////////////////////////////////////////////////////////////////
function showSearch() {
    $(CD_HTML.changeCityButton).hide();
    $(CD_HTML.photoAttrib).hide();
    $(CD_HTML.loader).hide();
    $(CD_HTML.bannerSubtext).hide();
    $(CD_HTML.goButton).hide();
    $(CD_HTML.searchButton).hide();
    $(CD_HTML.infoPanel).hide();
    $(CD_HTML.bannerHeader).text("Select your city from the list.")
    $(CD_HTML.bannerParagraphs).hide();
    $(CD_HTML.searchContainer).fadeIn('slow');
}

function showDashboard() {      
    $(CD_HTML.searchContainer).hide();
    $(CD_HTML.banner).hide();
    let cityName = ( typeof(cdUserLocation.city) === 'string' ? 
                     `${cdUserLocation.city.split(',')[0]}, ${cdUserLocation.city.split(',')[1]}` : 
                     `${cdUserLocation.city[0].split(',')[0]}, ${cdUserLocation.city[0].split(',')[1]}` );
    $(CD_HTML.navBarText).html(cityName);
    $(CD_HTML.changeCityButton).show();
    getWeatherData();
}

function getBackground() {

    if ( !sessionStorage.getItem('background') ) {
        let params = {
            client_id : CD_UNSPLASH_API.client_id,
            query : 'city'
        }    
        
        $.getJSON(CD_UNSPLASH_API.url, params)
            .then(function(res){
                if (res.urls) {
                    cdUserLocation.background = res.urls.regular;
                    sessionStorage.setItem('background', cdUserLocation.background);
                    sessionStorage.setItem('backgroundAuthorLink', res.user.links.html);
                    sessionStorage.setItem('backgroundAuthor', res.user.name);
                    setBackground();                   
                }
            })
            .catch(function(err) {
                console.log(err);
            });
    }
    else{
        cdUserLocation.background = sessionStorage.getItem('background');
        setBackground();
    }    
}

function setBackground(){
    $('body').css('background-image', 'url(' +  cdUserLocation.background + ')');
    $(CD_HTML.photoAttrib).html(`Photo by <a target="_blank" 
                                            href="${ sessionStorage.getItem('backgroundAuthorLink') + CD_UNSPLASH_API.attribUTMParam}">${sessionStorage.getItem('backgroundAuthor')}</a> / 
                                        <a target="_blank" href="https://unsplash.com/${CD_UNSPLASH_API.attribUTMParam}">Unsplash</a>`);
    $(CD_HTML.photoAttrib).show();
    $(CD_HTML.mapBackground).fadeIn('slow');
}

function showWeatherInformation(res) { 
    let weatherDataHTML = getWeatherDataHTML();
    $(CD_HTML.loader).hide();  
    addHeaderRow("Weather Forecast");
    $(CD_HTML.contentAreaContainer).append(weatherDataHTML);
}

function showLocalFood() {
    let mapInfoWindows = [];    
    let localFoodHtml = getLocalFood();
    addHeaderRow("Local Restaurants");    
    $(CD_HTML.contentAreaContainer).append(localFoodHtml);
    let mapCenter = { lat : cdUserLocation.latitude, lng : cdUserLocation.longitude };
    let foodMap = new google.maps.Map(document.getElementById('cd-localfood-map'), {
                                                                                zoom : 12, 
                                                                                center : mapCenter 
                                                                            });
    let foodRequest = {
        location : mapCenter,
        radius: '1000',
        query : 'restaurant'
    };

    let service = new google.maps.places.PlacesService(foodMap);
    service.textSearch(foodRequest, function(results, status){
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (let i = 0; i < results.length; i++) {
                let place = results[i];
                //console.log(place);
                let infoWindowContent = `<h6>${place.name}</h6>
                                         <p>${place.formatted_address.replace(',', '<br>')}</p>`;

                let infoWindow = new google.maps.InfoWindow({
                    content : infoWindowContent
                }); 
                let marker = new google.maps.Marker({
                    map: foodMap,
                    position : place.geometry.location,
                    animation: google.maps.Animation.DROP,
                    icon : { url: './assets/marker.png', scaledSize : new google.maps.Size(21,21) }
                });
                mapInfoWindows.push(infoWindow);
                marker.addListener('click', function() { 
                    infoWindow.open(foodMap, marker);
                    mapInfoWindows.forEach(function(item){
                        if ( item != infoWindow )
                            item.close();
                    })
                });
            }
        }
    });
    showLocalTodo();
}

function addHeaderRow(headerText){
    $(CD_HTML.contentAreaContainer).append(`
            <div class="row">
                <div class="col s12 m8 l6">
                    <div class="card-content grey-text text-lighten-5">
                        <h4>${headerText}</h4>
                    </div>                  
                </div>
            </div>`);
}

function showLocalTodo(){
    addHeaderRow("Things To Do");
    $(CD_HTML.contentAreaContainer).append(getThingsToDo());
    $("footer").fadeIn('slow');
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
    $(CD_HTML.loader).show();
    cdUserLocation.longitude = position.coords.longitude;
    cdUserLocation.latitude = position.coords.latitude;    

    let params = {
                    latlng : cdUserLocation.latitude + ',' + cdUserLocation.longitude,
                    key : CD_GOOGLE_APIS.GEOCODING.key
                 }
    $.getJSON(CD_GOOGLE_APIS.GEOCODING.url, params)
        .then(function(res){
            if (res.results) {
                let cities = res.results.map(
                    function(item) {
                        if ( item.formatted_address && "locality" === item.types[0] )
                            return item.formatted_address;
                    }).filter(
                    function(item) { 
                        if ( item ) return item;
                    });

                cdUserLocation.city = cities[0];    
                console.log( `User location updated: ${cdUserLocation.city}` );
                showDashboard();                

            } else {
                console.log('User locality could not be determined.');
                showSearch();
            }
        })
        .catch(function(err){
            console.log(err);
            showSearch();
        });
}

function handleError(err){
    console.log(err);
    showSearch();
}

///////////////////////////////////////////////////////////////////////////////
// Weather
///////////////////////////////////////////////////////////////////////////////
function getWeatherData() {
    let params = {
        q : `${cdUserLocation.latitude},${cdUserLocation.longitude}`,
        apikey : CD_ACCUWEATHER_API.key
    }

    $.getJSON(CD_ACCUWEATHER_API.citySearchUrl, params)
        .then( getWeatherLocationKeySuccess )
        .catch( handleError );
}

function getWeatherLocationKeySuccess(res) {

    if(res[0]){
        let weatherLocationKey = res[0].Key;

        let params = {
            apikey : CD_ACCUWEATHER_API.key
        }

        $.getJSON(CD_ACCUWEATHER_API.foreCastUrl + weatherLocationKey, params )
            .then( function(res){

                cdUserLocation.weather = res.DailyForecasts;
                cdUserLocation.weather.pop();
                console.log(`User location updated: Temp ${cdUserLocation.weather[0].Temperature.Maximum.Value}°F`);
                showWeatherInformation();
                showLocalFood();
            })
            .catch(function(err){
                console.log('Error getting weather forecast.');
                console.log(err.message);
                $(CD_HTML.photoAttrib).hide();
                alert('There was an error getting weather data. Sorry!');
            });
    } else {
        handleError("Error getting weather location key.");
        alert('There was an error while getting weather data. Sorry!');
    }    
}

function getFormattedDate(dtVal) {
    let weekday = new Array(7);
        weekday[0] = "Sunday";
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
    cdUserLocation.weather.map(
        function(item){
            item.Day.Icon = item.Day.Icon <= 9 ? '0' + item.Day.Icon : item.Day.Icon;
            element.append(
                `<div class="col s12 m6 l6 xl3">
                    <div class="card blue lighten-4 grey-text text-darken-4 z-depth-4">
                        <div class="card-content">
                        <img src="https://developer.accuweather.com/sites/default/files/${item.Day.Icon}-s.png" alt='Icon for current weather.' style="float:right"/>
                        <span class="card-title">${item.Temperature.Maximum.Value}°F</span><br>
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

    getBackground();
    return element;
}

function showWeatherError(err) {
    console.log('Error getting weather.');
    console.log(err.message);
    showSearch();
}

///////////////////////////////////////////////////////////////////////////////
// Local Restaurants
///////////////////////////////////////////////////////////////////////////////
function getLocalFood() {        
    let element = $('<div class="row"></div>');
    element.append(
        `<div class="col s12 m12 l12 xl12">
                    <div class="card grey-text text-darken-4 z-depth-4">
                        <div class="card-content">
                            <div id="cd-localfood-map"></div>
                        </div>
                        <div class="card-action grey lighten-5">
                            Restuarants in ${cdUserLocation.city}
                        </div>
                    </div>
                </div>`
    );

    return element;
}

///////////////////////////////////////////////////////////////////////////////
// Things To Do
///////////////////////////////////////////////////////////////////////////////
function getThingsToDo(){
    let params = {
        client_id : CD_FOURSQAURE_API.client_id,
        client_secret : CD_FOURSQAURE_API.client_secret,
        ll : cdUserLocation.latitude + ',' + cdUserLocation.longitude,
        categoryId : '4d4b7104d754a06370d81259' ,
        limit : 4,
        v : 20170701
    }

    let element = $('<div class="row" id="cd-things-todo"</div>');
    $.getJSON(CD_FOURSQAURE_API.url, params)
        .then(function(res){
            let images = [];
            if ( res.meta.code == 200 ) {                
                let todo = res.response.venues;                                
                todo.map(function(item){                    
                    images.push( { name : item.categories[0] ? item.categories[0].shortName.split(' ')[0] : item.name.split(' ')[0], id : 'cd-fs-img-' + images.length } );
                    element.append(
                    `<div class="col s12 m6 l6 xl3">
                        <div class="card z-depth-4">
                            <div class="card-image black">
                                <img id="${images[images.length-1].id}">
                                <span class="card-title">${ item.name }</span>
                            </div>
                            <div class="card-content">
                                <p>${item.location.formattedAddress[0]}<br>
                                ${ item.location.formattedAddress[1] ? item.location.formattedAddress[1] : ''}<br>
                                </p>
                            </div>
                            <div class="card-action">
                                <a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${item.location.address}">Get Directions</a>
                            </div>
                        </div>
                    </div>`);                    
                });
            }

            getTodoImages(images);
        })
        .catch(function(err){
            handleError(err.message);
        });

    return element;
}

function getTodoImages(images){        
    images.map(function(item){
        let params = {
            url: CD_UNSPLASH_API.url,
            client_id : CD_UNSPLASH_API.client_id,
            query : item.name
        }
        
        $.getJSON(CD_UNSPLASH_API.url, params)
            .then(function(res){            
                if (res.urls) {
                    $("#"+item.id).attr('src', res.urls.regular);
                }
            })
            .catch(function(err) {
                console.log(err);
            })
    }) 
}
