let express = require('express');
let router = express.Router();
let axios = require('axios');
let jwt_decode = require('jwt-decode');

const URL = 'https://api.jumpkeeper.com/api/';

const login = async (username, password) => {
    return axios.post(
        URL + 'jwt/token',
        {password, username},
        {headers: {'Content-Type': 'application/json'}}
    );
};

const refresh = async (accessToken, refreshToken) => {

    const data = { refresh_token: refreshToken};
    const config = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
        }
    };

    console.log('refresh!!!!!', {config, data});

    return axios.post(URL + 'refresh/token', data, config);
};

const calendar = async (accessToken, refreshToken) => {

    //let jwt = jwt_decode(accessToken);
    //console.log('jwt', jwt);

    //const cred = await refresh(accessToken, refreshToken);
    //console.log('cred!!!!', cred);

    return axios.get(
        URL + 'calendar/events?calendars=1,2,3,4,5,6,7,8,9,10,11,12,13,14',
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + accessToken
            }
        }
    );
};

module.exports = () => {

  router.get('/', (req, res, next) => {

      console.log('cook', req.cookies);
      const accessToken = req.cookies['accessToken'] || "";
      const refreshToken = req.cookies['refreshToken'] || "";

      if (req.session && accessToken.length > 0 && refreshToken.length > 0) {
          calendar(accessToken, refreshToken)
          .then(data => {
              console.log(data.data);

//              res.json(data.data)
              res.render('sc/index', {
                  title: 'login',
                  data: JSON.stringify(data.data)
              });


          }).catch(error => {
              console.log(error);
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

  router.get('/refresh', (req, res) => {

      const accessToken = req.cookies['accessToken'] || "";
      const refreshToken = req.cookies['refreshToken'] || "";

      refresh(accessToken, refreshToken)
      .then(jumpkeeper => {
          // console.log('data', jumpkeeper);

          res.cookie('accessToken', jumpkeeper.data.accessToken);
          res.cookie('refreshToken', jumpkeeper.data.refreshToken);
          res.json({jumpkeeper: jumpkeeper.data});

      }).catch(error => {
          const e = error.response.data;
          res.status(400).json({error: [e.message, e.exception, e.file, e.line]});
      });

  });

  return router;
};
