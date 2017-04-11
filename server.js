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

console.log('config info');
console.log(config.server);

// connect to the hosted mongo db instance
mongoose.connect( config.database.connectionURI, function (error) {
    if (error) console.error(error);
    else console.log('mongo connected');
});

// lets load the models
var Car        	= require('./car');
var User     	= require('./user');
var Activity 	= require('./activity');    

// static routes
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

// api routes
var apiRouter = express.Router();              // get an instance of the express Router

apiRouter.get('/', function(req, res) {

    res.json({ message: 'hooray! welcome to our api!' });   
});

// user routes

// create a new user
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
				message: 'Error saving user: ' + err
			});
		} 

	  	console.log('User created!');

		// now let's create a token for them!
		var token = jwt.sign(newUser, config.auth.secret, {
			expiresIn: '24h'
		});

		res.json({ 
			success: true, 
			message: 'User created successfully!',
			jwt: token
		});
	});
});

// authenticate a user
apiRouter.post('/authenticate', function(req, res){
	
	//debugging
	console.log('email: ' + req.body.email);
	console.log('password: ' + req.body.password);

	//get the user with the name passed in
	User.findOne({ email: req.body.email },
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
				console.log('user exists');
				console.log(user.email);

				//cool. we have a user found, but now we need to check their password
				if(bcrypt.compareSync(req.body.password, user.password)){
					
					//authenticate has worked, now we need to return a JWT
					var token = jwt.sign(user, config.auth.secret, {
						expiresIn: '7d' 
					});

					console.log('token');
					console.log(token);

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

// IMPORTANT! everything past this point will require an authenticated user

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

		console.log('Failed in authenticate middleware');

		// if there is no token then we need to return an error
		return res.status(403).send({
			message: 'No token provided',
			success: false
		});
	}
});

// get all users
apiRouter.get('/users', function(req, res){

	//let's display all the users
	User.find({}, function(err, users) {
		if (err) throw err;

		//return the array in json form
		res.json(users);
	});
});

// get user by id
apiRouter.get('/users/:user_id', function(req, res){
	User.findById(req.params.user_id, function(err, user){

		if (err) {
			return res.json({ message: 'No user exists for this ID'});
		}

		res.json(user);
	});
});

// get user by email
apiRouter.get('/users/email/:email', function(req, res){
	console.log(req.params.email);

	User.find(
	{ email : req.params.email }, 
	function(err, user){

		if (err) {
			return res.json({ message: 'No user exists for this email'});
		}

		res.json(user);
	});
});

// update the user
apiRouter.post('/users/update', function(req, res) {
	console.log(req.body.email)
	console.log(req.body.name)

	User.update(
	{
		// the query to get which user we want
		email : req.body.email	
	},
	{	
		// setting the parameters
		name : req.body.name,
		phonenumber : req.body.phonenumber,
		profile_picture : req.body.profile_picture

	}, function(err, numAffected) {
		if (err) {
			return res.json({
				success : false,
				message : err
			});
		} else {
			return res.json({
				success : true,
				message : numAffected
			});
		}
	});
});

//car routes

// create a new car
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

// get a car by id
apiRouter.get('/cars/:car_id', function(req, res) {
	//let's get a particular car
	Car.findById(req.params.car_id, function(err, car){
		if (err) {
			return res.json({ message: 'No car exists for this ID'});
		}

		// lets also get all the car activities from yesterday to infinite
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
	});	
});

// update a car by id 
apiRouter.post('/cars/update/:car_id', function(req, res) {
	console.log(req.params.car_id)

	Car.update(
	{
		// the query to get which user we want
		_id : req.params.car_id	
	},
	{	
		// setting the parameters
		name : req.body.name,
		description : req.body.description,
		seats :  req.body.seats,
		profile_picture : req.body.profile_picture

	}, function(err, numAffected) {
		if (err) {
			return res.json({
				success : false,
				message : err
			});
		} else {
			return res.json({
				success : true,
				message : numAffected
			});
		}
	});
});

// activity routes

// create a new activity
apiRouter.post('/activities', function(req, res) { 
	
	//get the users
	User.findOne({ email : req.body.email }, function(err, user) {
		if (err) throw err;

		if(!user) {
			return res.json({ message: 'User not found'});
		}

		// get the activities by car id
		Activity.find({ car : req.body.carId }, function(err, activities) {
			var overlappingActivities = [];
			
			var proposedCheckOutTime = moment(req.body.checkOutTime);
			var proposedCheckInTimeExpected = moment(req.body.checkInTimeExpected);

			var overlappingActivityError = "";

			activities.forEach(function(activity) {
				var existingCheckOutTime = activity.check_out_time;
				var existingCheckInTime = activity.check_in_time == null ? activity.check_in_time_expected : activity.check_in_time;

				//check out time & check in time range validation
				if (proposedCheckOutTime.valueOf() >= existingCheckOutTime.getTime() &&
					proposedCheckInTimeExpected.valueOf() <= existingCheckInTime.getTime())	{
					overlappingActivityError = 'Conflicting CheckOut & CheckIn Time!';
				}

				//check out time validation
				if (proposedCheckOutTime.valueOf() >= existingCheckOutTime.getTime() &&
					proposedCheckOutTime.valueOf() <= existingCheckInTime.getTime()){
					overlappingActivityError = 'Conflicting CheckOut Time!';
				}

				//check in time validation
				if (proposedCheckInTimeExpected.valueOf() >= existingCheckOutTime.getTime() &&
					proposedCheckInTimeExpected.valueOf() <= existingCheckInTime.getTime())	{
					overlappingActivityError = 'Conflicting CheckIn Time!';
				}
			});

			if(overlappingActivityError.length > 0){
				return res.json({
						success: false,
						message: overlappingActivityError
					});
			}

			//we're valid!

			// create a new activity
			var newActivity = Activity({
				user : user._id,
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
				} else {
				  	console.log('Activity created!');

					return res.json({ 
						success: true, 
						message: 'Activity created successfully!',
					});
				}
			});
		});
	});
});

// get all activities
apiRouter.get('/activities', function(req, res) { 
	//let's display all the activities
	Activity.find({}, function(err, activities) {
		if (err) throw err;

		//return the array in json form
		res.json(activities);
	}).populate('user', {email: 'email', profile_picture: 'profile_picture'});

	//todo populate user & car?
});

// get activities by car id
apiRouter.get('/activities/:car_id', function(req, res) { 
	
	console.log('got a get request for car activities');
	console.log(req.params.car_id);

	//let's display all the activities
	Activity.find({ car : req.params.car_id }, function(err, activities) {
		if (err) throw err;

		//return the array in json form
		res.json(activities);
	}).populate('user');
});

// update activity by activity id
apiRouter.post('/activities/update', function(req, res) { 
	
	console.log('got an update request for a car activity');
	console.log(req.body.activityId);
	console.log(req.body.checkInTime);

	Activity.update({ _id: req.body.activityId }, 
		{ check_in_time : req.body.checkInTime }, function(err, numAffected) {
		if (err) {
			return res.json({ 
				success: false, 
				message: 'Error updating activity: ' + err
			});
		} else {
		  	console.log('Activity updated!');

			return res.json({ 
				success: true, 
				message: 'Activity updated successfully!',
			});
		}
	});
});

// delete activity by activity id
apiRouter.post('/activities/delete', function(req, res) { 
	
	console.log('got a delete request for a car activity');
	console.log(req.body.activityId);

	// delete the activity
	Activity.remove({ _id: req.body.activityId }, function(err) {
		if (err) {
			return res.json({ 
				success: false, 
				message: 'Error deleting activity: ' + err
			});
		} else {
		  	console.log('Activity deleted!');

			return res.json({ 
				success: true, 
				message: 'Activity deleted successfully!',
			});
		}
	});
});

// register the routes to the /api directory
server.use('/api', apiRouter);
server.use('/', staticRouter);

server.listen(config.port || 9804, function () {
    console.log("Server started @ ", config.port || 9804);
});