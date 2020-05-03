var mongoose = require("mongoose");
var uniqueValidation = require('mongoose-unique-validator');
var bcrypt = require('bcrypt');

/*User schema makes sure that data validation is taking place
 https://thinkster.io/tutorials/node-json-api/creating-the-user-model*/
const userSchema = new mongoose.Schema({
    name: String,
    talent: String, 
    phone: Number,
    city: String,
    username: {type: String, lowercase: true, required: [true, "can't be blank"],
        match:[/^[a-zA-Z0-9]+$/, 'is invalid'], unique: true},
    email: {type: String, lowercase: true, required: [true, "can't be blank"],
        match: [/\S+@\S+\.\S+/, 'is invalid'], unique: true},
    password: String
});

userSchema.plugin(uniqueValidation, {message: 'is already taken'});

const userModel = mongoose.model('userModel', userSchema);

module.exports = userModel;

/*Hash password for protection for user
 https://medium.com/gomycode/authentication-with-passport-js-73ca65b25feb*/
module.exports.createUser = function (newUser, callback) {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err,hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}

/*Compares user-entered password with secure hash */
module.exports.validPassword = function(userPassword, hash, callback) {
    bcrypt.compare(userPassword, hash, function(err, isMatch){
        if(err) {throw err};
        callback(null, isMatch);
    });
}








