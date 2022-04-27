require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cron = require('node-cron')
var cors = require('cors')
const wompi = require('./wompi');
const con = require('./config/database');
const fn = require('./utils/fn');

const config = require('./config')

var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api')

var app = express();
// app.use(function (req, res, next) {
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
//     res.setHeader('Access-Control-Allow-Credentials', true)
//     next();
// })
app.use(cors({
    origin: ['*', 'http://localhost:4001'],
    credentials: true
}))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/api', apiRouter)


app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error')
})

var server = require('http').Server(app)

server.listen(config.port, () => {
    console.log(config)
    console.log(`Server running on port ${config.port}`)
})

module.exports = app;
