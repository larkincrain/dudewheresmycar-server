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
        previous : {
        	checked_out_by : {type : mongoose.Schema.Types.ObjectId, ref: 'User'},
        	passengers : [{type : mongoose.Schema.Types.ObjectId, ref: 'User'}],
        	message : {type : String, default: ''},
        	checked_out_time : {type : Date},
       		expected_return_time : {type : Date},
            checked_in_time : {type : Date}
        },
        current : {
            checked_out_by : {type : mongoose.Schema.Types.ObjectId, ref: 'User'},
            passengers : [{type : mongoose.Schema.Types.ObjectId, ref: 'User'}],
            message : {type : String, default: ''},
            checked_out_time : {type : Date},
            expected_return_time : {type : Date},
            checked_in_time : {type : Date}
        }, 
        next : {
            checked_out_by : {type : mongoose.Schema.Types.ObjectId, ref: 'User'},
            passengers : [{type : mongoose.Schema.Types.ObjectId, ref: 'User'}],
            message : {type : String, default: ''},
            checked_out_time : {type : Date},
            expected_return_time : {type : Date},
            checked_in_time : {type : Date}
        }   
    }
});