// app/models/user.js
// grab the mongoose module
var mongoose = require('mongoose');

// define our comment model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('User', {
    email: { type : String, default: '' },
    password: { type: String, default: ''},
    
    date_created: { type: Date, default: Date.now},
    profile_picture : { type: String, default: ''},
    admin: { type: Boolean, default: false}
});