// app/models/user.js
// grab the mongoose module
var mongoose = require('mongoose');

// define our comment model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Activity', {
    
	checked_out_by : {type : mongoose.Schema.Types.ObjectId, ref: 'User'},
	checked_out_time : {type : Date},
	expected_return_time : {type : Date},
	checked_in_time : {type : Date},

	passengers : [{type : mongoose.Schema.Types.ObjectId, ref: 'User'}],
	message : {type : String, default: ''}
	
});