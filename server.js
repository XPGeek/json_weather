'use strict'
let http = require('http');
let https = require('https');

var get_weather = function (location, scale){
  return new Promise( function(response, reject){

	var weather_url = 'https://query.yahooapis.com/v1/public/yql?q=select select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="nome, ak")';

    https.get(weather_url, function (yahoo_response) {
      console.log(yahoo_response.statusCode);
    });

  });

}

let server = http.createServer(function (weather_request, weather_response) {
  if( weather_request.method === 'GET' ) {
    weather_response.writeHead(200, {'Content-Type': 'text/plain'});
    var weather_info = get_weather("whatever", "nice");
    //console.log(weather_request.rawHeaders);
    //console.log(weather_request.socket);
    //console.log(weather_request.statusCode);
    console.log(weather_request.url);

    weather_response.end('TEST');
  } else {
    weather_response.writeHead(405, {'Content-Type': 'text/plain'});
    weather_response.end('Method Not Allowed\n');
  }
});



server.listen(8080);

console.log('Server running on port 8080');
