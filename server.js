'use strict'
let http = require('http');

let server = http.createServer(function (weather_request, weather_response) {
  if( weather_request.method === 'GET' ) {
    weather_response.writeHead(200, {'Content-Type': 'text/plain'});
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
