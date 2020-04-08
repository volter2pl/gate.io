let express = require('express');
let passport = require('passport');
let router = express.Router();
let configJavascript = require("../config.json").javascript;

module.exports = sockets => {

  router.get('/', (req, res, next) => {
    if (req.session.token) {
        res.cookie('token', req.session.token);
        res.render('gate', {
            title: 'Gate',
            ver: configJavascript.version,
            user: req.session.username
        });
    } else {
        res.cookie('token', '')
        res.redirect('/gate/auth/google');
    }
  });

  router.get('/open', (req, res, next) => {
    if (req.session.token) {
        console.log((new Date()) + ' Open gate START request from API user');
        sockets.gate_ws.broadcast('OPEN_GATE_START_REQUEST');
        setTimeout(() => {
            sockets.gate_ws.broadcast('OPEN_GATE_END_REQUEST');
            res.sendStatus(200);
        }, 200);
    } else {
        res.status(403);
        res.send('Unauthorized');
    }
  });

  router.get('/login', (req, res) => {
    res.render('login', {title: 'Gate', ver: configJavascript.version});
  });

  router.get('/logout', (req, res) => {
    req.logout();
    req.session = null;
    res.redirect('/gate/login');
  });

  router.get('/auth/google', passport.authenticate('google', {
    scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ]
  }));

  router.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/gate/login'
    }),
    (req, res) => {
        let userEmails = req.user.profile.emails
            .map(el => el.verified ? el.value : null)
            .filter(el => el != null);

        delete require.cache[require.resolve("../config.json")];
        let users = require("../config.json").users;

        if (users.some(email => userEmails.includes(email))) {
            console.log("user logged in", req.user.profile.displayName);
            req.session.token = req.user.token;
            req.session.username = req.user.profile.displayName;
            req.session.emails = userEmails;
            res.redirect('/gate');
        } else {
            console.error("access denied", req.user.profile.displayName, userEmails);
            req.session = null;
            res.redirect('/gate/login');
        }
    }
  );

/*
  router.get('/reset', function (req, res, next) {
    console.log((new Date()) + ' DEVICE RESET request from API user');
    sockets.gate_ws.broadcast('DEVICE_RESET');
  )};
*/
  return router;
};
