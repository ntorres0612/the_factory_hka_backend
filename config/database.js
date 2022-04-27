const mysql = require('mysql2');
// const pool = mysql.createPool({ host: 'localhost', password: 'nTorres.12', user: 'admin', database: 'genesis_ferregomez' });
const pool = mysql.createPool({ host: 'localhost', password: 'nTorres.12', user: 'admin', database: 'the_factory_hka' });
const promisePool = pool.promise()

module.exports = promisePool