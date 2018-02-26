'use strict'

//all internal requests use http, since no certificates are required
let http = require('http');

//all external requests can use https, since all the certificates for these sites are valid
let https = require('https');


//******************************************************************************************
//  Function: get_temperature
//  Arguments: woeid - https://en.wikipedia.org/wiki/WOEID
//             scale -
//
//******************************************************************************************

var get_temperature = function (woeid, scale){

  //creates a new Promise to the support the asynchronous nature of the query
  return new Promise( function(response, reject){

    var weather_url = 'https://query.yahooapis.com/v1/public/yql?q=select%20item.condition%20from%20weather.forecast%20where%20woeid%3D%22' + woeid +'%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

    https.get(weather_url, function (yahoo_response) {
      yahoo_response.setEncoding('binary');

			var resData = "";
			yahoo_response.on('data', function (chunk) {
				return resData += chunk;
			});
			yahoo_response.on('end', function () {
        //console.log(resData);
				var result = JSON.parse(resData);

				response(result);
			});

    });

  });

}

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
        //console.log(resData);
        var location_result = JSON.parse(location_response_data);
        //console.log("WOEID: " + location_result.query.results.place.woeid);

        response(location_result);
      });

    });

  });
}

let server = http.createServer(function (weather_request, weather_response) {
  if( weather_request.method === 'GET' ) {

    var location_json;
    var weather_json;

    console.log(weather_request.url);

    get_location("24060").then(function (response){
      console.log('WOEID from function: ' + response.query.results.place.woeid);
      location_json = response;

      get_temperature(response.query.results.place.woeid, "").then(function (response){
        console.log('Temp from function: ' + response.query.results.channel.item.condition.temp);
        weather_json = response;
      });

    });

    //notice how this prints out BEFORE the previous code due to asynchronous operations
    console.log("fuck: " + location_json);

    //console.log("fuck: " + location_json.query.results.place.woeid);

    //weather_response.writeHead(200, {'Content-Type': 'text/plain'});
    //var weather_info = get_weather("Blacksburg, VA", "Celsius");
    //console.log(result.query.results.channel.item.condition.temp);

    //console.log(weather_request.socket);
  //  console.log(weather_request.statusCode);

    weather_response.end('TEST');
  } else {
    weather_response.writeHead(405, {'Content-Type': 'text/plain'});
    weather_response.end('Method Not Allowed\n');
  }
});



server.listen(8080);

console.log('Server running on port 8080');
