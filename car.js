// app/models/user.js
// grab the mongoose module
var mongoose = require('mongoose');

// define our comment model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Car', {
    name : {type : String, default: ''},
    type : {type : String, default: ''},

    seats : {type : Number, default: 6 },
    description : {type : String, defaults: ''},
    profile_picture : {type: String, default: ''}, 
    
    booking : {
        previous : { type : mongoose.Schema.Types.ObjectId, ref : 'Activity' },
        current : { type : mongoose.Schema.Types.ObjectId, ref : 'Activity' }, 
        next : { type : mongoose.Schema.Types.ObjectId, ref : 'Activity' }   
    }
});