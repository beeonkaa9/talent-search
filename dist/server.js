
var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
var path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('dist'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});


http.listen(3000, function(){
    console.log('listening on *:3000');
});