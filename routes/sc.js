let express = require('express');
let router = express.Router();
let axios = require('axios');
let jwt_decode = require('jwt-decode');

const URL = 'https://api.jumpkeeper.com/api/';
const headers = {"Content-Type": "application/json", "Cache-Control": "no-cache"};

const login = async (username, password) => {
    return axios.post(URL + 'jwt/token', {password, username}, headers);
};

const refresh = async (refreshToken) => {
    try {
        const r = await axios.post(URL + 'refresh/token', {refresh_token: refreshToken}, headers);
        return r.data;
    } catch(error) {
        error.response.status = 401;
        throw error;
    }
};

const calendar = async (accessToken) => {
    return axios.get(
        URL + 'calendar/events?calendars=1,2,3,4,5,6,7,8,9,10,11,12,13,14',
        {headers: {...headers, Authorization: 'Bearer ' + accessToken}}
    );
};

module.exports = () => {

  router.get('/', async (req, res, next) => {

      let accessToken = req.cookies['accessToken'] || "";
      let refreshToken = req.cookies['refreshToken'] || "";

      if (req.session && accessToken.length > 0 && refreshToken.length > 0) {
          const jwt = jwt_decode(accessToken);

          try {
              if ( jwt.exp <= Math.round(Date.now()/1000) ) {
                  const cred = await refresh(refreshToken);
                  accessToken = cred.accessToken;
                  refreshToken = cred.refreshToken;
                  res.cookie('accessToken', accessToken);
                  res.cookie('refreshToken', refreshToken);
              }

              calendar(accessToken)
              .then(data =>
                  res.render('sc/index', {title: 'calendar', data: JSON.stringify(data.data)})
              );

          } catch(error) {
              if (error.response.status === 401) {
                  req.session = null;
                  res.render('sc/login', {title: 'login'});
              } else {
                  res.status(400).json({error: true});
              }
          };
      } else {
          console.log('no session');
          res.render('sc/login', {title: 'login'});
      }

  });

  router.get('/login', (req, res, next) => {
      res.render('sc/login', {title: 'login'});
  });

  router.get('/logout', (req, res, next) => {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.render('sc/login', {title: 'login'});
  });

  router.post('/login', (req, res, next) => {
      login(req.body.email, req.body.pass)
      .then(jumpkeeper => {
          res.cookie('accessToken', jumpkeeper.data.accessToken);
          res.cookie('refreshToken', jumpkeeper.data.refreshToken);
          res.json({redirect: '/sc/'});
      }).catch(error => {
          res.status(400);
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
          // res.status(400).json({error: [e.message, e.exception, e.file, e.line]});
          res.status(400);
      };

  });

  return router;
};
