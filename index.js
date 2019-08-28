//Przyłączenie modułu Express - framework
var express = require('express');
var expressSanitizer = require('express-sanitizer');
//Obiekt aplikacji
var app = express();
//Moduł dodający funkcje związane ze ścieżkami
var path = require('path');
//Operacje na systemie plików
var fs = require("fs");
//Odczytywanie treści z zapytań
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(expressSanitizer());
var cookieParser = require('cookie-parser');
app.use(cookieParser());

var baza = new Array();
var zawartosc = fs.readFileSync("data.json");
baza = JSON.parse(zawartosc);

var sanitizeHtml = require('sanitize-html');
sanitizeHtml.defaults.allowedTags = [];

//Port aplikacji
var broadcastport = process.argv[2] || process.env.PORT || 80;

function zapis(nazwapliku,zmienna)
{
    var json = JSON.stringify(zmienna); 
    fs.writeFileSync(nazwapliku, json); 
}
//Callback aplikacji przy zapytaniu
app.get('*', function(req, res){
    switch(req.path)
    {
        case "/":
            res.sendFile(__dirname + '/index.html');
            break;
        case "/status":
            if(req.cookies['brownie'] == baza.cookie)
            {
                var responsedata = {};
                responsedata.wpis = sanitizeHtml(baza.wpis);
                var responsetext = JSON.stringify(responsedata);
                res.send(responsetext);
            }
            else
            {
                res.sendStatus(200);
            }   
            break;
        case "/style.css":
            res.sendFile(__dirname + '/style.css');
            break;
    }
    });
        app.post('/login', function(req, res){
        console.log(req.body);
        if(req.body.login == baza.login && req.body.password == baza.password)
        {
            baza.cookie=Math.random().toString();
            baza.cookie=(baza.cookie).substring(2,(baza.cookie).length);
            zapis('data.json',baza);
            console.log('Logowanie udane.');
            console.log('Obecne ciasteczko: ' + req.cookies['brownie']);
            res.cookie('brownie',(baza.cookie), { maxAge: 5*60*1000, httpOnly: true });
            console.log('Nowe ciasteczko: ', (baza.cookie));
            var responsedata = {};
            responsedata.logged = true;
            responsedata.wpis = sanitizeHtml(baza.wpis);
            var responsetext = JSON.stringify(responsedata);
            res.send(responsetext);
        }
        else
        {
            var responsedata = {};
            responsedata.logged = false;
            var responsetext = JSON.stringify(responsedata);
            res.send(responsetext);
        }

        });
        app.post('/wpis', function(req, res){
            if(req.cookies['brownie'] == baza.cookie)
            {
                console.log("Nowy wpis: " + req.body.nowywpis);
                baza.wpis = req.body.nowywpis;
                zapis('data.json',baza);
                res.sendStatus(200);
            }
    
            });


//Aplikacja nasłuchuje na porcie
var serv = app.listen(broadcastport);

serv.on('listening', function(err)
{
    console.log('Aplikacja jest uruchomiona na porcie ' + broadcastport);
});

serv.on('error', function(err)
{
    if(err.errno == 'EADDRINUSE')
    {
        console.log('Aplikacja nie moze zostac uruchomiona na porcie ' + broadcastport);
    }
});