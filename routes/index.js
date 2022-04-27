const express = require('express');
const router = express.Router();
const con = require('../config/database');
const notification = require('../utils/notification');
const fn = require('../utils/fn');

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Maxigiros service printer' });
});

router.post('/events', async (req, res, next) => {
  console.log("___________________________From Wompi______________________________________");
  console.log(JSON.stringify(req.body, null, 4))
  fn.insertarVenta(req.body);

  res.status(200);
});

module.exports = router;

