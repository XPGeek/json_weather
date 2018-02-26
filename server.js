'use strict'

//all internal requests use http, since no certificates are required
let http = require('http');

//all external requests can use https, since all the certificates for these sites are valid
let https = require('https');

//includes the string tools for parsing and using querystring, used for parsing the URL query
//const querystring = require('querystring');
let querystring = require('querystring');

//******************************************************************************************
//  Function: get_forecast
//  Arguments: woeid - https://en.wikipedia.org/wiki/WOEID
//             scale - the scale ('Celsius'/'Fahrenheit')
//
//  Returns:   response - a JSON object with forcast information that has temperature data in the correct scale
//******************************************************************************************

var get_forecast = function (woeid, scale){

  //creates a new Promise to the support the asynchronous nature of the query
  //this concept was hard for me to grasp, so it is possible this is not implemented in the best way possible
  return new Promise( function(response, reject){

    //variable that contains the query url
    var weather_url;

    if(scale === "Celsius"){
      weather_url = 'https://query.yahooapis.com/v1/public/yql?q=select%20item.condition%20from%20weather.forecast%20where%20woeid%3D%22' + woeid +'%22and%20u=%22c%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
    }else{
      weather_url = 'https://query.yahooapis.com/v1/public/yql?q=select%20item.condition%20from%20weather.forecast%20where%20woeid%3D%22' + woeid +'%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
    }

    //makes a secure request using the query and parses the response
    https.get(weather_url, function (yahoo_response) {
      yahoo_response.setEncoding('binary');

      //this functionality was based on a stack overflow response, I am very unfamiliar with how to parse repsonses
			var forcast_response_data = "";
			yahoo_response.on('data', function (chunk) {
				return forcast_response_data += chunk;
			});

			yahoo_response.on('end', function () {
				var result = JSON.parse(forcast_response_data);
				response(result);
			});
    });
  });
}

//******************************************************************************************
//  Function: get_location
//  Arguments: zip-code - 5-digit zip-code #####
//
//  Returns:   response - a JSON object with geolocation information from the Yahoo geolocation API
//******************************************************************************************

var get_location = function(zip_code){
  return new Promise( function(response, reject){

    var location_url = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.places%20where%20text%3D%22' + zip_code + '%22%20limit%201&format=json';

    https.get(location_url, function(location_response){
      location_response.setEncoding('binary');

      var location_response_data = "";

      location_response.on('data', function (chunk) {
        return location_response_data += chunk;
      });

      location_response.on('end', function () {
        var location_result = JSON.parse(location_response_data);
        response(location_result);
      });
    });
  });
}

//******************************************************************************************
//  Core Logic
//  Arguments: weather_request - GET request formatted to the specification, there is some primitive error checking
//             weather_response - JSON object containing 2 items, a temperature numeral and scale factor
//
//******************************************************************************************
let server = http.createServer(function (weather_request, weather_response) {

  //if the GET request is properly formatted... ie has the /locations flag
  if( weather_request.method === 'GET' && weather_request.url.indexOf("/locations") > -1) {

    //console.log(weather_request.url);

    //getting the URL, we parse the zipcode and return if the zipcode is malformed.

    var query = weather_request.url;

        //zipcodes that are too long are simply truncated, the first group of 5 digits is taken as input.
    var zip_code_regex = new RegExp(/(\d\d\d\d\d)/g);
    var zip_code_matches = query.match(zip_code_regex);

    if(zip_code_matches === null){
      //no zipcode matches
      weather_response.writeHead(405, {'Content-Type': 'application/json'});
      weather_response.end('Zip-Code too Short!\n');
      return;
    }

    //parse the URL that we are given (or the options of the query) into things we can use
    //I am personally not to happy with this, since the first index contains the key value of the first part of URL, but correctly parses the scale option
    var query_components = querystring.parse(query,'?', '=');

    //console.log(query_components.scale);

    //objects that will be filled with the location and weather information
    var location_json;
    var weather_json;

    get_location(zip_code_matches[0]).then(function (response){
      //console.log('WOEID from function: ' + response.query.results.place.woeid);
      location_json = response;

      get_forecast(location_json.query.results.place.woeid, query_components.scale).then(function (response){
        //console.log('Temp from function: ' + response.query.results.channel.item.condition.temp);
        weather_json = response;

        //scale string that is put into the final JSON object
        var scale;

        if(query_components.scale === "Celsius"){
          scale = "Celsius";
        }else{
          scale = "Fahrenheit";
        }

        //now that we have all of our data, we can craft a response
        weather_response.writeHead(200, {'Content-Type': 'application/json'});
        //the * 1 operation on the attribute turns its type into an int
        weather_response.write(JSON.stringify({ temperature : weather_json.query.results.channel.item.condition.temp * 1, "scale" : scale }));
        weather_response.end();
      });
    });
  } else {
    weather_response.writeHead(405, {'Content-Type': 'application/json'});
    weather_response.end('Non-GET requests are not supported.\n');
  }
});

server.listen(8080);
console.log('Server online on port 8080...');
