
var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
var path = require('path');
var userModel = require("./models/user");
var bodyParser = require ('body-parser');
var cookieParser = require ('cookie-parser');

/*Will help with navigation of logged in/public users */
const publicRouter = require("./routes/public");
const homeRouter = require("./routes/home");
const logoutRouter = require("./routes/logout");

/*Connecting to MongoDB Atlas */
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:2020CoSci479@cluster0-jllfr.mongodb.net/test?retryWrites=true&w=majority', {
    useUnifiedTopology: true,
    useNewUrlParser: true}).catch(error => console.log("Something went wrong: " + error));
var modb = mongoose.connection;

app.set('views', path.join(__dirname, "/views"));
app.set("view engine", "ejs");

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

/*For sessions*/
var session = require('express-session');
var FileStore = require('session-file-store')(session);

/*Configuration for Passport (Express 4.x no longer has app.configure() method) */
app.use(session({
    name: 'session-id',
    secret: 'cats',
    resave: true,
    saveUninitialized: true,
    store: new FileStore()
}));

/*For authentication*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

/*
app.use('/', publicRouter);
app.use('/home', loginNeeded, homeRouter);
app.use('/logout', logoutRouter);
*/

/*Only allows page to render if user is logged in
https://scotch.io/tutorials/build-and-understand-a-simple-nodejs-website-with-user-authentication */
function loginNeeded(req, res, next) {
    if (!req.user) {
        return res.status(401).render("nouser");
    }
    next();
}

/*Authentication - http://www.passportjs.org/docs/*/

/*Strategy: LocalStrategy for username/password authentication 
if username or password is incorrect, callback indicates auth. failure
and message of what failed
Otherwise, callback sends back user that authenticated
If there is an error while verifying credentials, error is sent*/
const LocalStrategy = require("passport-local").Strategy;
const local = new LocalStrategy(function(username, password, done) {
        userModel.findOne({username: username}, function (err, user) {
            if (err) {return done(err);}
            if (!user) {
                return done(null, false, {message: 'Incorrect username'});
            }
            if (!user.validPassword(password)) {
                return done(null, false, {message: 'Incorrect password'});
            }
            return done(null, user);
        });
});

passport.use('local', local);

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

/*Creation of new user 
https://medium.com/gomycode/authentication-with-passport-js-73ca65b25feb*/
app.post('/registration', function(req, res){
    var pass = req.body.password;
    var pass2 = req.body.password2;

    if (pass == pass2) {
        var newUser = new User ({
            name: req.body.name,
            email: req.body.email,
            talent: req.body.talent,
            phone: req.body.phone,
            username: req.body.username,
            password: req.body.password
        });

        User.createUser(newUser, function(err, user){
            if (err) {return done(err)};
            res.send(user.end());
        })
    }
    else {
        res.status(500).send("{errors: \"Passwords don't match. Try again\"}").end();
    }
}); 

app.all("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

app.get("/", function(req, res){
    res.render("index", {user:req.user});
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});