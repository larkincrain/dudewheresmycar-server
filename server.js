var express  = require('express'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser')
    config = require('./config.js'),
	morgan = require('morgan'),
	bcrypt = require('bcrypt-nodejs'),
	jwt = require('jsonwebtoken'),
	cors = require('cors'),
	moment = require('moment');


var server = express();
server.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
server.use(bodyParser.json({ limit: '5mb'}));
//server.use(bodyParser.urlencoded({ limit: '5mb'}));
server.use(morgan('dev')); // LOGGER

// Connect to the hosted mongo DB instance
mongoose.connect( config.database.connectionURI, function (error) {
    if (error) console.error(error);
    else console.log('mongo connected');
});

// lets load the mod els
var Car        	= require('./car');
var User     	= require('./user');
var Activity 	= require('./activity');    

// Static Routes
var staticRouter = express.Router();

server.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});

server.use(cors());

server.get('/', function(req, res) {
	
    res.send('Hello! The API is at http://localhost:' + config.port + '/api');
});

// API routes
var apiRouter = express.Router();              // get an instance of the express Router

apiRouter.get('/', function(req, res) {

    res.json({ message: 'hooray! welcome to our api!' });   
});

//users

// Create a new User
apiRouter.post('/users', function(req, res){
	// create a new user
	var newUser = User({
	  name: req.body.name,
	  email: req.body.email,
	  password: req.body.password,
	  profile_picture: req.body.profile_picture,
	  admin: req.body.admin,
	});

	//we only want to save the encrypted user's password
	newUser.password = bcrypt.hashSync(newUser.password);

	// save the user
	newUser.save(function(err) {
		if (err) {
			return res.json({ 
				success: false, 
				message: 'error saving user: ' + err
			});
		} 

	  	console.log('User created!');

		// now let's create a token for them!
		var token = jwt.sign(newUser, config.auth.secret, {
			expiresIn: '24h' 
		});

		res.json({ 
			success: true, 
			message: 'user created successfully!',
			token: token
		});
	});
});

//Authenticate a userx
apiRouter.post('/authenticate', function(req, res){
	//debugging
	console.log('email: ' + req.body.email);
	console.log('password: ' + req.body.password);

	//get the user with the name passed in
	User.findOne(
		{ email: req.body.email},
		function(err, user){
			if (err){
				res.json({ 
					message: 'Error occured: ' + err,
					success: false
				});
			}

			if (!user) {
				res.json({ 
					message: 'User doesnt exist',
					success: false
				});	
			} else {
			
				//cool. we have a user found, but now we need to check their password
				if( bcrypt.compareSync(req.body.password, user.password)){
					//authenticate has worked, now we need to return a JWT

					var token = jwt.sign(user, config.auth.secret, {
						expiresIn: '24h' 
					});

					res.json({
						message: 'Welcome!',
						success: true,
						jwt: token,
						user: user
					});

				} else {
					//wrong password
					res.json({ 
						message: 'Incorrect password.', 
						success: false
					});
				}
			}
		});
});

// Everything past this point will require an authenticated user
apiRouter.use( function(req, res, next){
	var token = req.body.token ||
		req.query.token ||
		req.headers['x-access-token'];

	console.log('request');

	//try to decode the token if we have one
	if (token) {
		jwt.verify(token, config.auth.secret, function(err, decoded) {
			if (err) {
				return res.json({ 
					message: 'Failed to authenticate token.',
					success: false
				});
			} else {
				// if everything is chill, then save the decoded token in the request
				// so we can use in the following routes
				req.decoded = decoded;
				next();
			}
		});
	} else {

		console.log('failed in authenticate middleware');

		// if there is no token then we need to return an error
		return res.status(403).send({
			message: 'No token provided',
			success: false
		});
	}
});

// user routes
// get all users
apiRouter.get('/users', function(req, res){

	//let's display all the users
	User.find({}, function(err, users) {
		if (err) throw err;

		//return the array in json form
		res.json(users);
	});
});

// get one user by their id
apiRouter.get('/users/:user_id', function(req, res){
	User.findById(req.params.user_id, function(err, user){

		if (err) {
			return res.json({ message: 'No user exists for this ID'});
		}

		res.json(user);
	});
});

//cars

// Car routes!!!! :)
// create a new Car
apiRouter.post('/cars', function(req, res) { 
	// create a new user
	var newCar = Car({
		name: req.body.name,
		profile_picture: req.body.profile_picture,
	  	seats: req.body.seats,
	  	description: req.body.description
	});

	// save the user
	newCar.save(function(err) {
		if (err) {
			return res.json({ 
				success: false, 
				message: 'Error saving car: ' + err
			});
		} 

	  	console.log('Car created!');

		res.json({ 
			success: true, 
			message: 'Car created successfully!',
		});
	});
});

// get all cars
apiRouter.get('/cars', function(req, res) { 
	//let's display all the cars
	Car.find({}, function(err, cars) {
		if (err) throw err;

		//return the array in json form
		res.json(cars);
	});
});

// get a particular car
apiRouter.get('/cars/:car_id', function(req, res) {
	//let's get a particular car
	Car.findById(req.params.car_id, function(err, car){
		if (err) {
			return res.json({ message: 'No car exists for this ID'});
		}

		// lets also get all teh bookings for the previous day onward
		Activity.find({
			car : req.params.car_id
		}, function(err, activities) {
			var filteredActivities = [];
			var twoDaysAgo = moment(req.query.date).subtract(2, 'days');

			activities.forEach(function(activity) {
				if (activity.check_out_time.getTime() > twoDaysAgo.valueOf() || 
					// TODO activity.check_in_time.getTime() > twoDaysAgo.valueOf() ||
					activity.check_in_time_expected.getTime() > twoDaysAgo.valueOf())
					filteredActivities[filteredActivities.length] = activity;
			});

			res.json({
				car: car,
				filteredActivities : filteredActivities
			});
		});

		//	res.json(car);
	});	
});

//activities

//create a new activity
apiRouter.post('/activities', function(req, res) { 
	
	//get the user
	User.find({ email : req.body.email }, function(err, users) {
		if (err) throw err;

		if(!users || users.length != 1) {
			return res.json({ message: 'Multiple users exists for this email'});
		}

		// create a new activity
		var newActivity = Activity({
			user : users[0].userId,
			car : req.body.carId,
			check_out_time : req.body.checkOutTime,
			check_in_time_expected : req.body.checkInTimeExpected,
			message : req.body.message
		});

		// save the activity
		newActivity.save(function(err) {
			if (err) {
				return res.json({ 
					success: false, 
					message: 'Error saving activity: ' + err
				});
			} 

		  	console.log('Activity created!');

			return res.json({ 
				success: true, 
				message: 'Activity created successfully!',
			});
		});
	});
});

// get all the activities
apiRouter.get('/activities', function(req, res) { 
	//let's display all the activities
	Activity.find({}, function(err, activities) {
		if (err) throw err;

		//return the array in json form
		res.json(activities);
	});

	//todo populate user & car?
});

// get all activities for a particular car
apiRouter.get('/activities/:car_id', function(req, res) { 
	
	console.log('got a request for activities from  a car');
	console.log(req.params.car_id);

	//let's display all the activities
	Activity.find({ car : req.params.car_id }, function(err, activities) {
		if (err) throw err;

		//return the array in json form
		res.json(activities);
	});
});

// register the routes to the /api directory
server.use('/api', apiRouter);
server.use('/', staticRouter);

server.listen(config.port || 9804, function () {
    console.log("Server started @ ", config.port || 9804);
});


