
const config = require('./config')
const merchantPublicKey = process.env.MERCHANT_PUBLIC_KEY || ''
const axios = require('axios');
const con = require('./config/database');
const fn = require('./utils/fn')


exports.merchants = () => {
    return new Promise((resolve, reject) => {
        axios.get(`${config.wompi.url}merchants/${merchantPublicKey}`)
            .then(function (response) {
                resolve(response.data)
            }).catch(function (error) {
                reject(error);
            });
    });
}
exports.transactionsStatus = transaction_id => {

    return new Promise(async (resolve, reject) => {
        const headers = {
            "Content-type": "application/json",
            'Authorization': `Bearer ${merchantPublicKey}`
        }
        axios.get(`${config.wompi.url}transactions/${transaction_id}`, { headers: headers })
            .then(async function (response) {
                console.log(response.data)
                console.log("______________________transactionsStatus_________________________________")

                if (response.data.data.status != 'PENDING') {
                    let query = `UPDATE venta_tmp SET email = 'sent', estado = '${response.data.data.status}' WHERE transaction_id = '${transaction_id}'`;
                    con.query(query);
                    // fn.sendEmailPayment(transaction_id, response.data.data.status)
                }

                let url = response.data.data.payment_method.extra.async_payment_url ? response.data.data.payment_method.extra.async_payment_url : null
                let data = {
                    status: 'success',
                    url,
                    data: response.data.data
                };
                await fn.insertarVenta(data);
                resolve(data)
            }).catch(error => {
                console.log(error);
                reject(error);
            });
    });
}
exports.financialInstitutions = _ => {

    return new Promise((resolve, reject) => {
        const headers = {
            "Content-type": "application/json",
            'Authorization': `Bearer ${merchantPublicKey}`
        }
        axios.get(`${config.wompi.url}pse/financial_institutions`, { headers: headers })
            .then(function (response) {
                resolve(response.data)
            }).catch(error => {
                console.log(error);
                reject(error);
            });
    });
}
exports.transactions = async (body, idusuario) => {

    console.log("___________________________________IdUsuario______________________________________________")
    console.log(idusuario);
    console.log("___________________________________Body______________________________________________")
    console.log(body)
    return new Promise(async (resolve, _) => {
        try {
            let products = [];
            let data = {};
            let total = 0;
            if (body.products) {
                console.log(typeof body.products)
                if (typeof body.products == 'object')
                    products = body.products;
                else
                    products = JSON.parse(body.products);

                products.map(product => {
                    console.log("El product", product)
                    total += product.writed * product.precio
                })
            }
            let referencia = generateReference();

            switch (body.type) {

                case "bancolombia":
                    data = {
                        "acceptance_token": body.acceptanceToken,
                        "reference": referencia,
                        "amount_in_cents": total * 100,
                        "currency": "COP",
                        "customer_email": body.email,
                        "redirect_url": config.wompi.urlRedirectOther,
                        "payment_method": {
                            "type": "BANCOLOMBIA_TRANSFER",
                            "user_type": "PERSON",
                            "payment_description": `Pago tienda Quintech referencia = ${referencia}`,
                            "sandbox_status": "APPROVED"
                        }
                    }
                    break;

                case "corresponsal":
                case "efectivo":
                    data = {
                        "acceptance_token": body.acceptanceToken,
                        "reference": referencia,
                        "amount_in_cents": total * 100,
                        "currency": "COP",
                        "customer_email": body.email,
                        "redirect_url": config.wompi.urlRedirectOther,
                        "payment_method": {
                            "type": "BANCOLOMBIA_COLLECT",
                            "payment_description": `Pago tienda Quintech referencia = ${referencia}`,
                            "sandbox_status": "APPROVED"
                        }
                    }
                    break;

                case "nequi":
                    data = {
                        "acceptance_token": body.acceptanceToken,
                        "reference": referencia,
                        "amount_in_cents": total * 100,
                        "currency": "COP",
                        "customer_email": body.email,
                        "redirect_url": config.wompi.urlRedirectOther,
                        "payment_method": {
                            "type": "NEQUI",
                            "phone_number": body.nequiPhoneNumber,
                            "payment_description": `Pago tienda Quintech referencia = ${referencia}`,
                        }
                    }
                    break;

                case "pse":
                    data = {
                        "acceptance_token": body.acceptanceToken,
                        "reference": referencia,
                        "amount_in_cents": total * 100,
                        "currency": "COP",
                        "customer_email": body.email,
                        "redirect_url": config.wompi.urlRedirectOther,
                        "payment_method": {
                            "type": "PSE",
                            "user_type": 0,
                            "user_legal_id_type": body.documentType, // Tipo de documento, CC o NIT
                            "user_legal_id": body.documentNumber,
                            "financial_institution_code": body.financialInstitution, // Código (`code`) de la institución financiera
                            "payment_description": `Pago tienda Quintech referencia = ${referencia}`,
                        }
                    }
                    break;

                case "card":
                case "tarjeta":
                    let query = `SELECT * FROM token_card WHERE id = ${body.cardId}`
                    let [rows] = await con.execute(query)
                    let token = rows[0].token;
                    data = {
                        "acceptance_token": body.acceptanceToken,
                        "reference": referencia,
                        "amount_in_cents": total * 100,
                        "currency": "COP",
                        "customer_email": body.email,
                        "redirect_url": config.wompi.urlRedirectOther,
                        "payment_method": {
                            "type": "CARD",
                            "installments": body.cuotas,
                            "token": token,
                        }
                    }

                    break;

                default:
                    break;
            }

            if (process.env.NODE_ENV === 'development') {
                data.payment_method.sandbox_status = "APPROVED"
            }
            if (body.source == 'mobile')
                delete data.redirect_url;

            console.log("___________________________________Data to send______________________________________________")
            console.log(data);
            const headers = {
                "Content-type": "application/json",
                'Authorization': `Bearer ${merchantPublicKey}`
            }
            axios.post(`${config.wompi.url}transactions`, data, { headers: headers })
                .then(async (response) => {

                    let dataResponse = response.data.data;
                    let query = `INSERT INTO venta_tmp VALUES(NULL,'${referencia}', '${dataResponse.id}', null, current_timestamp , current_timestamp, null , null , 1 , 1 , 1 , ${idusuario} , null,  false , '${dataResponse.status}',  0,  0, false, null , null , null, null, null, null, null, null , null , null, null, null, 0, 0, 0, 0, 0, null, null)`;
                    let [rows] = await con.execute(query)

                    products.map(product => {
                        query = `INSERT INTO producto_venta_tmp VALUES(null, ${product.id} , ${product.writed}, ${product.precio}, 0, 0,  3, ${rows.insertId}, '' )`

                        con.execute(query)
                    });
                    console.log("___________________________________Data response______________________________________________")
                    console.log("dataResponse      ", dataResponse)

                    resolve({ "status": "success", "payment": dataResponse })

                }).catch(error => {

                    console.log("error", error)
                    resolve({ "status": "error", error })
                });

        } catch (error) {
            console.log(error.data)
            resolve({ "status": "error", error })
        }
    });
}
exports.tokenize = (body, id) => {

    let data = {
        "number": body.cardNumber.replace(/\s/g, ''),
        "cvc": body.cvc.toString(),
        "exp_month": body.cardMonth.toString(),
        "exp_year": body.cardYear.toString(),
        "card_holder": body.cardNames.toString(),
    }

    return new Promise((resolve, reject) => {
        const headers = {
            "Content-type": "application/json",
            'Authorization': `Bearer ${merchantPublicKey}`
        }
        axios.post(`${config.wompi.url}tokens/cards`, data, { headers: headers }).then(async (response) => {
            if (response.data.status.trim() === "CREATED") {
                try {
                    //req.decoded.id
                    query = `INSERT INTO token_card VALUES(NULL,'${response.data.data.last_four}',${id},'${response.data.data.id}','${response.data.data.created_at}', current_timestamp,  '${response.data.data.brand}')`;
                    let [rows] = await con.execute(query)
                    resolve({ status: 'success', id: rows.insertId });
                } catch (error) {
                    console.log("error", error)
                    reject({ status: 'error' });
                }
            }
        }).catch(error => {
            console.log(error);
            reject(error);
        });
    });
}
function generateReference() {
    return (Date.now() + ((Math.random() * 100000).toFixed()))
}
