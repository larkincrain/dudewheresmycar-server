// server.js

// modules =================================================
var express        = require('express');
var app            = express();
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var bcrypt 		   = require('bcrypt-nodejs');
var jwt 		   = require('jsonwebtoken');
var serveStatic	   = require('serve-static');
var mongoose 	   = require('mongoose');
var cors 		   = require('cors');

// configuration ===========================================
    
// config files
var db = require('./config/db');

// set our port
var port = process.env.PORT || 8005; 

// connect to our mongoDB database 
// (uncomment after you enter in your own credentials in config/db.js)
// mongoose.connect(db.url); 

// get all data/stuff of the body (POST) parameters
// parse application/json 
app.use(bodyParser.json()); 

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); 

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true })); 

app.use( bodyParser.json({limit: '50mb'}) );
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit:50000
}));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override')); 

// set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public')); 
//app.use(serveStatic('public/ftp', {'index': ['index.html']}))

app.use(cors());

// Connect to the hosted mongo DB instance
mongoose.connect( db.url, function (error) {
    if (error) console.error(error);
    else console.log('mongo connected');
});


// routes ==================================================
require('./routes')(app); // configure our routes

// route to handle creating goes here (app.post)
// route to handle delete goes here (app.delete)

// start app ===============================================
// startup our app at http://localhost:8080
app.listen(port);               

// shoutout to the user                     
console.log('Magic happens on port ' + port);
console.log('Lets get ready to rock');

// expose app           
exports = module.exports = app;