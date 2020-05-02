/*Logs out a user*/
const express = require("express");
const router = express.Router();

router.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

module.exports = router;