// app/models/user.js
// grab the mongoose module
var mongoose = require('mongoose');

// define our comment model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Activity', {
    
	user : {type : mongoose.Schema.Types.ObjectId, ref: 'User'},
	car : {type : mongoose.Schema.Types.ObjectId, ref: 'Car'},

	check_out_time : {type : Date},
	check_in_time_expected : {type : Date},
	check_in_time : {type : Date},

	// passengers : [{type : mongoose.Schema.Types.ObjectId, ref: 'User'}],
	message : {type : String, default: ''}
	
});