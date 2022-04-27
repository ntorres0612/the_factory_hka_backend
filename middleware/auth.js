
var express = require('express')
const jwt = require("jsonwebtoken");

const authMiddleware = express.Router();
authMiddleware.use((req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.SECRET, (err, decoded) => {
            if (err) {
                return res.json({ status: 'err', message: 'jwt expired', err });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        res.send({
            authHeader,
            status: 'error',
            message: 'jwt expired'
        });
    }
});
module.exports = authMiddleware