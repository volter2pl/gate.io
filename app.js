module.exports = function(sockets) {

  let createError = require('http-errors');
  let express = require('express');
  let basicAuth = require('express-basic-auth');
  let path = require('path');
  let bodyParser = require('body-parser');
  let cookieParser = require('cookie-parser');
  let cookieSession = require('cookie-session');
  let logger = require('morgan');
  let passport = require('passport');
  let auth = require('./auth');
  let sessionOptions = require("./config.json").session;

  let indexRouter = require('./routes/index');
  let gateRouter = require('./routes/gate')(sockets);
  let scRouter = require('./routes/sc')();

  auth(passport);
  let app = express();

// view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  app.use(logger('dev'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(express.urlencoded({extended: false}));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(passport.initialize());
  app.use(cookieSession(sessionOptions));

  app.use('/', indexRouter);
  app.use('/gate', gateRouter);
  app.use('/sc', scRouter);

// catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });

// error handler
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  return app;

};
