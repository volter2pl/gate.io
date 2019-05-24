let express = require('express');
let router = express.Router();

module.exports = function(sockets) {

  router.get('/', function (req, res, next) {
    res.render('gate', {title: 'Gate', ver: Math.random().toString(36).substring(7)});
  });

  router.get('/open', function (req, res, next) {
    console.log((new Date()) + ' Open gate START request from API user');
    sockets.gate_ws.broadcast('OPEN_GATE_START_REQUEST');
    setTimeout(() => {
        sockets.gate_ws.broadcast('OPEN_GATE_END_REQUEST');
        res.sendStatus(200);
    }, 200);
  });
/*
  router.get('/reset', function (req, res, next) {
    console.log((new Date()) + ' DEVICE RESET request from API user');
    sockets.gate_ws.broadcast('DEVICE_RESET');
  )};
*/
  return router;
};