//import roles from './roles.js';

var roles = require('./roles.js');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mysql = require('mysql');
var rateLimit = require("express-rate-limit");

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);
 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

//  apply to all requests
app.use(limiter);

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


//====VALORANTERY====
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
        console.log('GET: /createparty | New Party: ' + partycode);
    });
    dbConn.query('SELECT * FROM party WHERE code=?;', partycode, function (error, results, fields){
        if (error) throw error;
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

app.get('/party/:code/nextround', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let code = req.params.code;
    if (!code) {
        return res.status(400).send({ error: true, message: 'Please provide a party code' });
    }
    console.log('GET: /party/'+code+'/nextround');
    //CHECK IF PROVIDED KEY MATCHES & generate next round
    var cur = 0;
    dbConn.query('SELECT cur FROM party WHERE code=?;', code, function (error, results, fields){
        if (error) throw error;
        cur = results[0].cur;
        console.log(cur);
        console.log('cur is '+cur);
        var round = parseInt(getCurSlice(cur, 0, 3));
        round = (round+1)%8;
        console.log('new round is '+round)
        var newcur = insertCurSlice(cur, round, 0, 3);
        console.log('new cur is '+newcur);
        dbConn.query('UPDATE party SET cur = ? WHERE code = ?;', [newcur, code], function (error, results, fields){
            if (error) throw error;
            return res.send({ error: false, data: results, message: 'Party has been updated successfully.' });
        });
    });
    
});

function randomString (length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

//====BLOG====
//id|title|desc|text|date|author|latest
//1|'Why bla is great'|'Ever wondered why bla is great? Here it is.'|'...'|2020-27-9|staddle|1
 // connection configurations
 var dbConnBlog = mysql.createConnection({
    host: 'localhost',
    user: 'valorantuser',
    password: 'valorantisworse',
    database: 'bloggy'
});
// connect to database
dbConnBlog.connect();

//GET /blog/latest/:nmb
//Returns the latest x blog entries. No nmb returns the latest one entry.
app.get('/blog/latest/:nmb', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let nmb = req.params.nmb;
    if (!nmb) {
        nmb=1;
    }
    console.log('GET: /blog/latest/'+nmb);
    dbConn.query('SELECT * FROM blog WHERE latest<?;', id, function (error, results, fields){
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Blog entries returned successfully.' });
    });
});

//GET /blog/:id 
//Return the blog entry and every other field
app.get('/blog/:id', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let id = req.params.id;
    if (!id) {
        return res.status(400).send({ error: true, message: 'Please provide a blog id' });
    }
    console.log('GET: /blog/'+id);
    dbConn.query('SELECT * FROM blog WHERE id=?;', id, function (error, results, fields){
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Blog entry returned successfully.' });
    });
});

//POST /blog
//DATA: {id:x; data:''; token:''}
//Create new blog entry for id x
app.post('/blog', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    
});

//PUT /blog/:id
//DATA: {id:x; data:''; token:'';}
//Update existing blog entry for id x
app.put('/blog/:id', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    
});

//DELETE /blog/:id
//DATA: {id:x; data:''; token:'';}
//Delete existing blog entry for id x
app.delete('/blog/:id', function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    
});

//====FINISH====
function randomRole () {
    var rand = Math.floor(Math.random() * roles.length);
    return roles[rand];
}

function getCurSlice(cur, start, length) {
    var bincur = fillUp(parseInt(cur, 10).toString(2), 26);
    var slice = bincur.substring(start, start+length);
    return parseInt(slice, 2).toString(10);
}

function insertCurSlice(cur, insert, start, length) { //0, 1, 0, 3
    var bincur = fillUp(parseInt(cur, 10).toString(2), 26); //
    console.log(bincur)
    var bininsert = fillUp(parseInt(insert, 10).toString(2), length);
    console.log(bininsert)
    var newbincur = bincur.substring(0,start) + bininsert + bincur.substring(start+length);
    return parseInt(newbincur, 2).toString(10);
}

function fillUp(cur, digits){
    if(cur.length<digits){
        return '0'.repeat(digits-cur.length)+cur;
    }
    return cur;
}
// set port
app.listen(3000, function () {
    console.log('Node app is running on port 3000');
});
module.exports = app;