let express = require('express');
let router = express.Router();

module.exports = () => {

  router.get('/', (req, res, next) => {
        // res.cookie('token', req.session.token);
        res.send({ok: true});
  });
  return router;
};
