var express = require('express')
var router = express.Router()
const con = require('../config/database');
const config = require('../config');
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth")
const wompi = require('../wompi');
const uuid = require('uuidv1')
const mailer = require('../utils/mailer')
const fs = require('fs');


router.post('/list-rif-type', async (req, res) => {
    let query = `SELECT * FROM rif_type`
    const [rows] = await con.execute(query)

    res.json({ "status": true, message: '', rifTypes: rows })
});
router.post('/create-invoice', async (req, res) => {

    try {

        let customerId = '';
        let emmiterId = '';
        let invoiceId = '';

        let query = `SELECT * FROM customer WHERE document_number = '${req.body.customer.document_number}'`;
        let [customer] = await con.execute(query);
        customer = customer.length > 0 ? customer[0] : null;

        if (!customer) {
            customer = req.body.customer
            query = `INSERT INTO customer VALUES(NULL,'${customer.name}','${customer.lastname}','${customer.document_number}')`;
            let [rows] = await con.execute(query);
            customerId = rows.insertId;
        } else {
            customerId = customer.id;
        }



        query = `SELECT emitter.* FROM emitter  
                     INNER JOIN rif ON rif_id = rif.id 
                     WHERE number = '${req.body.emitter.document_number}'`;

        console.log(query);
        let [emitter] = await con.execute(query);
        emitter = emitter.length > 0 ? emitter[0] : null;

        console.log('xxxxxxxxxxxxxxxxxxxxx');
        console.log(emitter);
        if (!emitter) {
            emitter = req.body.emitter

            query = `INSERT INTO rif VALUES(NULL,'${emitter.document_number}', ${emitter.document_type})`;
            let [rif] = await con.execute(query);

            query = `INSERT INTO emitter VALUES(NULL,'${emitter.business_name}', ${rif.insertId})`;
            let [rows] = await con.execute(query);
            emmiterId = rows.insertId;
        } else {
            emmiterId = emitter.id
        }

        console.log("ASDLASDLASDKKLASD " + emmiterId);


        query = `INSERT INTO invoice VALUES(NULL,'${emmiterId}', ${customerId}, current_timestamp)`;
        console.log(query);
        let [rows] = await con.execute(query);
        invoiceId = rows.insertId;

        await asyncForEach(req.body.products, async (product, index) => {

            query = `SELECT * FROM product WHERE code = '${product.code}'`;
            let [productFound] = await con.execute(query);
            productFound = productFound.length > 0 ? productFound[0] : null;

            let productId = '';

            if (!productFound) {
                query = `INSERT INTO product VALUES(NULL,${product.code}, '${product.description}', ${product.price})`;
                let [productInserted] = await con.execute(query);
                productId = productInserted.insertId;
            } else {
                productId = productFound.id;
            }

            query = `INSERT INTO invoice_product VALUES(NULL,${invoiceId}, ${productId}, ${product.quantity})`;
            await con.execute(query);

        });

        res.json({
            status: 'success',
            message: 'Invoice create succeseful'
        });
    } catch (error) {
        console.log(error)
        res.json({ status: 'error' });
    }

});
router.post('/list-invoices', async (req, res) => {
    let query = `SELECT invoice.*                     
                 FROM invoice
                 INNER JOIN customer ON customer_id = customer.id`;
    let [invoices] = await con.execute(query);
    list = []

    await asyncForEach(invoices, async (invoice, index) => {

        let query = `SELECT *                     
            FROM emitter
            INNER JOIN rif ON rif.id = emitter.rif_id
            INNER JOIN rif_type ON rif.rif_type_id = rif_type.id
            WHERE emitter.id = '${invoice.emitter_id}'`;
        let [emitter] = await con.execute(query);
        emitter = emitter.length > 0 ? emitter[0] : {};

        query = `SELECT *                     
            FROM customer
            WHERE id = '${invoice.customer_id}'`;
        let [customer] = await con.execute(query);
        customer = customer.length > 0 ? customer[0] : {};

        query = `SELECT *                     
            FROM invoice_product
            INNER JOIN product ON product.id = product_id
            WHERE invoice_id = '${invoice.id}'`;
        let [products] = await con.execute(query);

        invoice.emitter = emitter;
        invoice.customer = customer;
        invoice.products = products;

        list.push(invoice);
    });


    res.json({ "status": 'success', 'message': 'Ok', invoices: list });


});
router.post('/delete-invoices', async (req, res) => {
    let query = `DELETE FROM invoice`
    const [rows] = await con.execute(query);
    res.json({ "status": 'success', 'message': 'Ok', });
});
const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
};
const createToken = (user, secret, expiresIn) => {
    const { id, nombres, apellidos, foto } = user

    return jwt.sign({
        id,
        nombres,
        apellidos,
        foto
    }, secret, { expiresIn })
};
module.exports = router

