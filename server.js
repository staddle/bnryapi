var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mysql = require('mysql');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
// default route
app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/', function (req, res) {
    return res.send({ error: true, message: 'default route' })
});
 // connection configurations
 var dbConn = mysql.createConnection({
    host: 'localhost',
    user: 'valorantuser',
    password: 'valorantisworse',
    database: 'valorantery'
});
// connect to database
dbConn.connect();

app.get('/party/:code', function(req, res){ //maybe do authorization tokes when creating party -> need token when deleting / changing rounds etc
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let code = req.params.code;
    if (!code) {
        return res.status(400).send({ error: true, message: 'Please provide a party code' });
    }
    console.log('GET: /party/'+code);
    dbConn.query('SELECT * FROM party WHERE code=?', code, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'party' });
       });
});

app.get('/createparty', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    var partycode = randomString(5, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
    dbConn.query('INSERT INTO party(code) VALUES(?);', partycode, function (error, results, fields){
        if (error) throw error;
        console.log('GET: /party/create | New Party: ' + partycode);
    });
    dbConn.query('SELECT * FROM party WHERE code=?;', partycode, function (error, results, fields){
        if (error) throw error;
        console.log('GET: /party/create | New Party: ' + partycode);
        return res.send({ error: false, data: results[0], message: 'Party created successfully.' });
    });
});

app.get('/party/delete/:code', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let code = req.params.code;
    if (!code) {
        return res.status(400).send({ error: true, message: 'Please provide a party code' });
    }
    console.log('GET: /party/delete/'+code);
    dbConn.query('DELETE FROM party WHERE code=?;', code, function (error, results, fields){
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Party has been deleted successfully.' });
    });
});

function randomString (length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};
// set port
app.listen(3000, function () {
    console.log('Node app is running on port 3000');
});
module.exports = app;