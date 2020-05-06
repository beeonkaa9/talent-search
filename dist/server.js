
var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
var path = require('path');
var userModel = require("./models/user");
var bodyParser = require ('body-parser');

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

app.get("/form", function(req, res){
    res.render("form");
});
app.post("/group", function(req,res) {
    const talentform = req.body.talentf
    const cityform = req.body.cityf
    userModel.listAllUsers(talentform,cityform).then(function(users){
        res.render("group", {users:users});
    }).catch(function(error){ 
        res.error("Something went wrong!" + error );
    });
    
})
/*Authentication - http://www.passportjs.org/docs/*/

/*Strategy: LocalStrategy for username/password authentication 
if username or password is incorrect, callback indicates auth. failure
and message of what failed
Otherwise, callback sends back user that authenticated
If there is an error while verifying credentials, error is sent*/
const LocalStrategy = require("passport-local").Strategy;

const local = (new LocalStrategy (function(username, password, done) {
    userModel.findOne({username: username}, function(err, user){
        if(err) return done(err);
        if(!user) {
            return done (null, false, {message: 'Incorrect username'});
        }
        userModel.validPassword(password, user.password, function(err, isMatch){
            if(err) return done(err);
            if(isMatch){
                return done(null, user);
            } else {
                return done(null, false, {message: 'Incorrect password'});
            }
        });
    });
    }
));

passport.use('local', local);

/*Session- serialize and deserialize user instances to support login sessions 
Only user ID is serialized, and when requests are received this is used
to find the user and restore it to req.user*/
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    userModel.findById(id, function(err, user) {
        done(err, user);
    });
});

/*Creation of new user 
https://medium.com/gomycode/authentication-with-passport-js-73ca65b25feb*/
app.post('/registration', function(req, res){
    var pass = req.body.password;
    var pass2 = req.body.password2;

    if (pass == pass2) {
        var newUser = new userModel ({
            name: req.body.name,
            email: req.body.email,
            talent: req.body.talent,
            phone: req.body.phone,
            city: req.body.city,
            username: req.body.username,
            password: req.body.password
        });

        userModel.createUser(newUser, function(err, user){
            if (err) throw err;
            res.send(user).end();
        });
    }
    else {
        res.status(500).send("{error: \"Passwords don't match. Try again\"}");
        //res.redirect('/registration');
        return;
    }
}); 

/*Returns the users that are searched for in form.ejs */
app.get("/group", function(req,res) {
    userModel.listAllUsers().then(function(users){
        res.render("group", {users:users});
    }).catch(function(error){ 
        res.error("Something went wrong!" + error );
    });
    
})




/*If user successfully logs in, redirect to home
Otherwise, redirect to login */
app.post('/login',
    passport.authenticate('local', {
        successRedirect: "/",
        failureRedirect: "/contact.html" //CHANGE THIS!!!!
    })
);

/*Logout route */
app.all("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});


app.get('/user', function(req, res) {
    res.send(req.user);
}); 

app.get("/", function(req, res){
    res.render("index", {user:req.user});
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});