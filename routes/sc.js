let express = require('express');
let router = express.Router();
let axios = require('axios');
let jwt_decode = require('jwt-decode');

const URL = 'https://api.jumpkeeper.com/api/';

const login = async (username, password) => {
    return axios.post(
        URL + 'jwt/token',
        {password, username},
        {headers: {"Content-Type": "application/json", "Cache-Control": "no-cache"}}
    );
};

const refresh = async (refreshToken) => {

    const data = { refresh_token: refreshToken};
    const config = {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
        }
    };

    try {
        const r = await axios.post(URL + 'refresh/token', data, config);
        return r.data;
    } catch(e) {
        console.log('error', e);
    }

    return {accessToken: "", refreshToken: ""};
};

const calendar = async (accessToken) => {
    return axios.get(
        URL + 'calendar/events?calendars=1,2,3,4,5,6,7,8,9,10,11,12,13,14',
        {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                Authorization: 'Bearer ' + accessToken
            }
        }
    );
};

module.exports = () => {

  router.get('/', async (req, res, next) => {

      let accessToken = req.cookies['accessToken'];
      let refreshToken = req.cookies['refreshToken'];

      if (req.session && accessToken.length > 0 && refreshToken.length > 0) {
          let jwt = jwt_decode(accessToken);
          console.log(jwt);

          if ( jwt.exp <= Math.round(Date.now()/1000) ) {
              const cred = await refresh(refreshToken);
              accessToken = cred.accessToken;
              refreshToken = cred.refreshToken;
              res.cookie('accessToken', accessToken);
              res.cookie('refreshToken', refreshToken);
          }

          calendar(accessToken)
          .then(data => {
              res.render('sc/index', {
                  title: 'login',
                  data: JSON.stringify(data.data)
              });
          }).catch(error => {
              // if 401
              // res.redirect('/sc/login');
              console.log(error.data);
              res.status(400).json(error);
          });
      } else {
          res.redirect('/sc/login');
      }

  });

  router.get('/login', (req, res, next) => {
        res.render('sc/login', {
            title: 'login'
        });
  });

  router.post('/login', (req, res, next) => {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      login(req.body.email, req.body.pass)
      .then(jumpkeeper => {
          res.cookie('accessToken', jumpkeeper.data.accessToken);
          res.cookie('refreshToken', jumpkeeper.data.refreshToken);
          res.json({redirect: '/sc/'});
      }).catch(error => {
          console.error(error);
          res.status(400).json('error');
      })
  });

  router.get('/refresh', async (req, res) => {

      try {
          const jumpkeeper = await refresh(req.cookies['refreshToken']);

          res.cookie('accessToken', jumpkeeper.accessToken);
          res.cookie('refreshToken', jumpkeeper.refreshToken);

          res.json({jumpkeeper: jumpkeeper});
      } catch(error) {
          const e = error.response.data;
          res.status(400).json({error: [e.message, e.exception, e.file, e.line]});
      };

  });

  return router;
};
