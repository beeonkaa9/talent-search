var mongoose = require("mongoose");
var uniqueValidation = require('mongoose-unique-validator');
var bcrypt = require('bcrypt');

/*User schema makes sure that data validation is taking place
 https://thinkster.io/tutorials/node-json-api/creating-the-user-model*/
var userSchema = new mongoose.Schema({
    name: String,
    talent: String, 
    phone: Number,
    username: {type: String, lowercase: true, required: [true, "can't be blank"],
        match:[/^[a-zA-Z0-9]+$/, 'is invalid'], unique: true},
    email: {type: String, lowercase: true, required: [true, "can't be blank"],
        match: [/\S+@\S+\.\S+/, 'is invalid'], unique: true},
    password: String
});

userSchema.plugin(uniqueValidation, {message: 'is already taken'});

const userModel = mongoose.model('user', userSchema);

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

/*
/*Protect user passwords with salt and hash:
Five parameters for pbkdf2Sync: password, salt,
iteration for hashing, length of hash, and algorithm


userSchema.methods.setPassword = function(password){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.pwhash = crypto.pbkdf2Sync(password, this.salt, 5000, 512, 'sha512').toString('hex');
};

/*Validate password
userSchema.methods.validPassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 5000, 512, 'sha512').toString('hex');
    return hash == pwhash;
}

/*Generates jsonwebtoken - expires 10 days after today
signs according to database id of user, username, and time
userSchema.methods.generateJWT = function(){
    var today = new Date();
    var expire = new Date(today);
    expire.setDate(today.getDate() + 10);

    return jwt.sign({
        id: this._id,
        username: this.username,
        expire: parseInt(expire.getTime()/1000),
    }, secret);
};

/*JSON representation of user for authentication
userSchema.methods.toAuthJSON = function(){
    return {
        name: this.name,
        talent: this.talent, 
        phone: this.phone,
        username: this.username,
        email: this.email,
        token: this.generateJWT()
    };
};
*/




