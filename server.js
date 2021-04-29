var http = require('http');
var fs = require('fs');

const hostname = '0.0.0.0';
const port = 8192;

fs.readFile('./index.html', function (err, html) {
    if (err) {
        throw err; 
    }       
    http.createServer(function(request, response) {  
        response.writeHeader(200, {"Content-Type": "text/html"});  
        response.write(html);  
        response.end();
    }).listen(port, hostname);
});