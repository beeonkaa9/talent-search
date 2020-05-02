/*Establishes a route for users that are not
logged in 
https://scotch.io/tutorials/build-and-understand-a-simple-nodejs-website-with-user-authentication*/
const express = require('express');
const router = express.Router();

router.get('/', function(req, res){
    res.render('index.html');
});

module.exports = router;