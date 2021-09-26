let express = require('express');
let router = express.Router();

module.exports = () => {

  router.get('/', (req, res, next) => {

      if (req.session.token) {
          res.cookie('token', req.session.token);

          res.render('gate', {
              title: 'Gate',
              ver: configJavascript.version,
              user: req.session.username
          });

      } else {
          res.redirect('/sc/login');
      }

  });

    router.get('/login', (req, res, next) => {
        res.render('login', {
            title: 'login'
        });
    });

    router.post('/login', (req, res, next) => {
        res.send({
            email: req.body.email,
            pass: req.body.password,
        });
    });

  return router;
};
