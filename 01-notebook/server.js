var http = require('http');
var querystring = require('querystring');
var escape_html = require('escape-html');
var serveStatic = require('serve-static');
var url = require('url')


var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('notes.sqlite');


// Serve up public folder 
var servePublic = serveStatic('public', {
  'index': false
});
 
function renderNotes(req, res) {
    db.all("SELECT rowid AS id, text FROM notes", function(err, rows) {
        if (err) {
            res.end('<h1>Error: ' + err + '</h1>');
            return;
        }
        res.write('<link rel="stylesheet" href="style.css">' +
                  '<h1>AAF Notebook</h1>' +
                  '<form method="POST">' +
                  '<label>Note: <input name="note" value=""></label>' +
                  '<button>Add</button>' +
                  '</form>');

        res.write('<ul class="notes">');
        
        rows.forEach(function (row) {     
            res.write('<form method="POST" action="/delete/' + row.id + '">' +
                    '<li>' +
                    escape_html(row.text) +
                    '<br/>' +
                    '<button type="submit">Delete</button>' +
                    '</li>' +
                    '</form>');
        });
        res.end('</ul>');
    });
}

var server = http.createServer(function (req, res) {
    servePublic(req, res, function () {
        if (req.method == 'GET') {
            res.writeHead(200, {'Content-Type': 'text/html'});
            renderNotes(req, res);
        }
        else if (req.method == 'POST' && url.parse(req.url).pathname.includes('/delete')) {
            let noteId = url.parse(req.url).pathname.replace('/delete/', '')
            var body = '';
            req.on('data', function (data) {
                body += data;
                console.log(body)
            });
            req.on('end', function () {
                var form = querystring.parse(body);
                db.exec('DELETE FROM notes WHERE rowid=' + noteId + ';', function (err){
                    if (err) {
                        console.log(err)
                        res.writeHead(201, {'Content-Type': 'text/html'});
                        renderNotes(req, res);
                    }
                })
            });
            
        }
        else if (req.method == 'POST') {
            var body = '';
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                var form = querystring.parse(body);
                db.exec('INSERT INTO notes VALUES ("' + form.note + '");', function (err) {
                    console.error(err);
                    res.writeHead(201, {'Content-Type': 'text/html'});
                    renderNotes(req, res);
                });
                renderNotes(req, res);
            });
        }
    });
});

// initialize database and start the server
db.on('open', function () {
    db.run("CREATE TABLE notes (text TEXT)", function (err) {
        console.log('Server running at http://127.0.0.1:8080/');
        server.listen(8080);
    });
});
