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
            res.write('<form method="POST">' +
                    '<li>' +
                    escape_html(row.text) +
                    '<br/>' +
                    '<button type="submit" name="delete", value="' + row.id + '">Delete</button>' +
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
        else if (req.method == 'POST') {
            var body = '';
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                var form = querystring.parse(body);
                console.log(form);
                console.log(form.delete)
                var stringForm = querystring.stringify(form);
                console.log(stringForm);
                if (stringForm.includes("note")) {
                    db.exec('INSERT INTO notes VALUES ("' + form.note + '");', function (err) {
                        console.error(err);
                        res.writeHead(201, {'Content-Type': 'text/html'});
                        renderNotes(req, res);
                    });
                }
                else {
                    console.log("delete");
                    var noteId = stringForm.replace('delete=', '');
                    db.exec('DELETE FROM notes WHERE rowid=' + noteId + ';', function (err) {
                        console.log(err);
                        res.writeHead(201, {'Content-Type': 'text/html'});
                        renderNotes(req, res);
                    })
                }
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
