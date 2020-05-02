
var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
var path = require('path');
var userModel = require("./models/user");

/*Will help with navigation of logged in/public users */
const publicRouter = require("./routes/public");
const homeRouter = require("./routes/home");
const logoutRouter = require("./routes/logout");



const mongoose = require('mongoose');
var session = require('express-session'),
    bodyParser = require('body-parser');

mongoose.connect('mongodb+srv://admin:2020CoSci479@cluster0-jllfr.mongodb.net/test?retryWrites=true&w=majority', {
    useUnifiedTopology: true,
    useNewUrlParser: true}).catch(error => console.log("Something went wrong: " + error));


app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + "/pages"));

/*Configuration for Passport (Express 4.x no longer has app.configure() method) */
app.use(session({
    secret: 'cats',
    resave: true,
    saveUninitialized: true
}));

/*For authentication*/
var passport = require('passport'), 
    LocalStrategy = require ('passport-local').Strategy;
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

app.use(express.static('dist'));
app.use(express.static(__dirname + "/pages"));

app.use('/', publicRouter);
app.use('/home', loginNeeded, homeRouter);
app.use('/logout', logoutRouter);


/*Only allows page to render if user is logged in
https://scotch.io/tutorials/build-and-understand-a-simple-nodejs-website-with-user-authentication */
function loginNeeded(req, res, next) {
    if (!req.user) {
        return res.status(401).render("nouser");
    }
    next();
}


/*Creation of new user 
app.post('/user', function(req, res){
    console.log("User: " + JSON.stringify(req.body.user));
    var newUser = new userModel(req.body.user);
    
    newUser.save().then(function(){
        res.send("Added new user to database!");
    }).catch(function(err){
        res.err("Failed to add new user to database!");
    });
}); */

/*Authentication - http://www.passportjs.org/docs/*/

/*Strategy: LocalStrategy for username/password authentication 
if username or password is incorrect, callback indicates auth. failure
and message of what failed
Otherwise, callback sends back user that authenticated
If there is an error while verifying credentials, error is sent*/
passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({username: username}, function (err, user) {
            if (err) {return done(err);}
            if (!user) {
                return done(null, false, {message: 'Incorrect username'});
            }
            if (!user.validPassword(password)) {
                return done(null, false, {message: 'Incorrect password'});
            }
            return done(null, user);
        });
    }
));

/*Session- serialize and deserialize user instances to support login sessions 
Only user ID is serialized, and when requests are received this is used
to find the user and restore it to req.user*/
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

/*If user successfully logs in, redirect to home
Otherwise, redirect to login */
app.post('/login',
    passport.authenticate('local', {
        successRedirect:'/',
        failureRedirect: '/login.html'
}));

http.listen(3000, function(){
    console.log('listening on *:3000');
});