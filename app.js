var http = require('http'),
    path = require('path'),
    hbs = require ('hbs'),
    sass = require('node-sass'),
    express = require('express'),
    _ = require('lodash');

var data = {},
    locations = require('./data/locations'),
    sessions = require('./data/sessions'),
    sponsors = require('./data/sponsors'),
    workshops = require('./data/workshops');

_.assign(data, locations, sessions, sponsors, workshops);

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon(path.join(__dirname, 'public/favicon.ico')));
  app.set('views', __dirname + '/views');
  app.set('view engine' ,'hbs');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(sass.middleware({
     src: __dirname + '/public/sass',
     dest: __dirname + '/public',
     debug: true
  }));
  app.use(express.static(path.join(__dirname, 'public')));
});

hbs.registerPartials(__dirname + '/views/partials');

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function (req, res) {
  res.render('index', data);
});

app.get('/workshop', function (req, res) {
  res.render('pullout', workshops);
});

app.get('/workshop/:slug', function (req, res) {
  var workshopData = {};

  _.assign(workshopData, _.filter(workshops.workshops, { 'slug': req.params.slug }));

  res.render('pullout', {
    workshops: workshopData
  });
});


/* API? */
app.get('/api/all', function (req, res) {
  res.json(data);
});
app.get('/api/sessions', function (req, res) {
  res.json(sessions);
});
app.get('/api/locations', function (req, res) {
  res.json(locations);
});
app.get('/api/sponsors', function (req, res) {
  res.json(sponsors);
});
app.get('/api/workshops', function (req, res) {
  res.json(workshops);
});


app.get('/sponsorship', function (req, res) {
  res.render('sponsorship');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
