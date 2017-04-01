// app/models/user.js
// grab the mongoose module
var mongoose = require('mongoose');

// define our comment model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Activity', {
    
    action : {type : String},
    user : {type : mongoose.Schema.Types.ObjectId, ref: 'User'},
	date : {type : Date},
    car : {type : mongoose.Schema.Types.ObjectId, ref: 'Car'},

});