var express = require('express');
var mongoose = require('mongoose');
var app = express();
const port = 3000;

mongoose.connect('mongodb://localhost:27017/website', {useNewUrlParser: true}).catch(error => console.log("Something went wrong: " + error));

var userModel = require("./models/user");

app.set("view engine", "ejs");
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static(__dirname + "/pages"));
app.get("/form", function(req, res){
    res.render("form");
});

app.get("/group", function(req,res) {
    userModel.listAllUsers().then(function(users){
        res.render("group", {users:users});
    }).catch(function(error){ 
        res.error("Something went wrong!" + error );
    });
    
})

app.post('/user', function(req, res){
    console.log("User: " + JSON.stringify(req.body.user));
    var newUser = new userModel(req.body.user);
    
    newUser.save().then(function(){
        res.send("Added new user to database!");
    }).catch(function(err){
        res.err("Failed to add new user to database!");
    });
});

app.listen(port, function() {
  console.log("App listening on port " + port + " !");
});
