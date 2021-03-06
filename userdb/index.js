var express = require('express');
var mongoose = require('mongoose');
var app = express();
const port = 3000;

mongoose.connect('mongodb://localhost:27017/website', {useNewUrlParser: true}).catch(error => console.log("Something went wrong: " + error));

var userModel = require("./user");

app.set("view engine", "ejs");
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static(__dirname + "/pages"));
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


app.listen(port, function() {
  console.log("App listening on port " + port + " !");
});
