/*The homepage when users are logged in
https://scotch.io/tutorials/build-and-understand-a-simple-nodejs-website-with-user-authentication*/ 

const express = require("express");
const router = express.Router();

router.get("/", function(req, res){
    res.render("home.html")
});

module.exports = router;