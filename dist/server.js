
require('dotenv').config();
var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
var path = require('path');
var userModel = require("./models/user");
var bodyParser = require ('body-parser');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');

/*cloudinary */
var multer = require('multer');
var cloudinary = require('cloudinary');
var cloudinaryStorage = require('multer-storage-cloudinary');

cloudinary.cloudinary_js_config();

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
var fsOption = {retries: 0};

app.use(cookieParser());
/*Configuration for Passport (Express 4.x no longer has app.configure() method) */
app.use(session({
    name: 'session-id',
    secret: 'cats',
    resave: true,
    saveUninitialized: true,
    store: new FileStore(fsOption)
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

/*For flash messages*/
app.use(flash());
app.use(function(req, res, next) {
    res.locals.messages = req.flash();
    next();
});


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

/*Cloudinary storage and configuration */
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: "images",
    allowedFormats: ["jpg", "png"],
    transformation: [{width: 300, height: 300, crop: "limit"}]
});

const parser = multer({storage:storage});

/*ROUTES*/

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
        
        userModel.createUser(newUser, function(err, user) {
            if (err) {
                throw err;
            } else {
                req.login(user, function(err) {
                    if (err) {
                        throw err;
                    }
                    return res.redirect('/home');
                });
            }
        });
    }

    else {
        res.status(500).send("{error: \"Passwords don't match\"}");
        /*
        req.flash("messages", {"error" : "Passwords don't match"});
        res.locals.messages = req.flash();
        res.render("registration");
         */
        
    }
}); 

/*Uploads file and returns an object with file information (for displaying image)
URL - allows you to display the image on homepage
public_id - identifies image for access and deletion from Cloudinary
https://www.freecodecamp.org/news/how-to-allow-users-to-upload-images-with-node-express-mongoose-and-cloudinary-84cefbdff1d9/ */
app.post("/api/images", parser.single("image"), function(req,res){
    console.log(req.file);
    const picture = {};
    picture.url = req.file.url;
    picture.id = req.file.public_id;
    Pictures.create(picture)
        .then(newPictures => res.json(newPictures))
        .catch(err => console.log(err));
})

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
    
});

/*Returns the users that are searched for in form.ejs */
app.get("/group", function(req,res) {
    userModel.listAllUsers().then(function(users){
        res.render("group", {users:users});
    }).catch(function(error){ 
        res.error("Something went wrong!" + error );
    });
    
});

/*If user successfully logs in, redirect to home
Otherwise, redirect to login */
app.post('/login',
    passport.authenticate('local', {
        successRedirect: "/",
        failureRedirect: "/login.html"
    })
);

/*Logout route (old)
app.all("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});
*/

app.get("/logout", function (req, res, next) {
    if (req.session) {
        req.session.destroy(function(err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
});


app.get('/signup', function(req, res) {
    req.flash('test' , 'testing flash');
    res.render('registration');
});

app.get('/user', function(req, res) {
    res.send(req.user);
}); 

/*If user is logged in, render home. 
Otherwise, render index page */
app.get("/", function(req, res){
    if (req.user) {
        res.render("home", {user:req.user});
    } else {
        res.render('index');
    }  
}); 

app.get("/home", function(req,res){
    res.render("home", {user:req.user});
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});