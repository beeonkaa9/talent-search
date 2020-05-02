var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    name: String,
    talent: String, 
    phone: Number,
    email: String
});

userSchema.statics.listAllUsers = function() {
    return this.find({});
};

var userModel = mongoose.model('user', userSchema);

module.exports = userModel;


