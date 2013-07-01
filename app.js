var http = require('http'),
    path = require('path'),
    hbs = require ('hbs'),
    sass = require('node-sass'),
    express = require('express'),
    slugify = require('slug'),
    marked = require('marked'),
    _ = require('lodash'),
    app = express();

require('datejs');

var data = {},
    locations = require('./data/locations'),
    sessions = require('./data/sessions'),
    sponsors = require('./data/sponsors'),
    workshops = require('./data/workshops');

app.set('mode', 'titles'), // titles|speakers|schedule

sessions = (function (sessionData) {
  /*
    titles = titles and descriptions only
    speakers = titles, descriptions and available speaker information (name, photo, etc)
    schedule = full schedule with all data and times
  */
  var tempSessions = [],
      sessions = sessionData.sessions,
      startTime = new Date(sessionData.startTime);

  // slugify all titles
  sessions.forEach(function (session) {
    session.slug = slugify(session.title.toLowerCase());
  });

  // TODO: This section can probably be made a lot cleaner
  // with some map reduce pluck vooodoo
  if (app.settings.mode === "titles") {
    sessions.forEach(function (session) {
      if (session.break) return;
      tempSessions.push({
        title: session.title,
        description: session.description
      });
    });
  };

  if (app.settings.mode === "speakers") {
    sessions.forEach(function (session) {
      if (session.break) return;
      tempSessions.push({
        title: session.title,
        description: session.description,
        speaker: session.speaker
      });
    });
  }

  if (app.settings.mode === "schedule") {
    sessions.forEach(function (session) {
      session.start = startTime.clone().toString('HH:mm');
      session.end = startTime.add({ minutes: session.duration }).clone().toString('HH:mm');
    });
    tempSessions = sessions;
  }

  return {
    sessions: tempSessions
  };
})(sessions);


sessions.sessions.forEach(function (session) {
  if ( (session.speaker && session.speaker.twitter)
    || session.slides
    || session.audio
    || session.video
  ) {
    session.links = true;
  }
});

// TODO When full schdule order session array according to 'startTime'
// so that order in sessions.json is not important

_.assign(data, locations, sessions, sponsors, workshops);

app.configure('production', function () {
  app.set('isproduction', true);
});

app.configure(function (){
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
     debug: !app.settings.isproduction
  }));
  app.use(express.static(path.join(__dirname, 'public')));
});

hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('markdown', function (options) {
  return marked(options.fn(this));
});


app.configure('development', function (){
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

http.createServer(app).listen(app.get('port'), function (){
  console.log("Express server listening on http://localhost:" + app.get('port'));
});
