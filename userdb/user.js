var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    name: String,
    talent: String, 
   
    phone: Number,
    email: String
});



userSchema.statics.listAllUsers = function(name, name2) {
    return this.find({talent : name , city:name2});
};

var userModel = mongoose.model('user', userSchema);

module.exports = userModel;


