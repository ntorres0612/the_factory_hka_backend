const con = require('../config/database');
const notification = require('../utils/notification');
const mailer = require('../utils/mailer');

exports.insertarVenta = async response => {


    let reference = response.data.reference;
    let transaction_id = response.data.id;
    let status = response.data.status;


    return new Promise(async (resolve, _) => {
        let query = `SELECT * FROM venta WHERE transaction_id = '${transaction_id}'`
        let [sale] = await con.query(query);
        if (sale.length == 0) {
            let query = `SELECT * FROM venta_tmp WHERE transaction_id = '${transaction_id}'`
            console.log(query);
            let [venta] = await con.query(query);
            if (venta.length > 0) {
                if (status == 'APPROVED') {
                    let query = `UPDATE venta_tmp SET estado = '${status}', transaction_id = '${transaction_id}' WHERE referencia = '${reference}'`
                    await con.execute(query);

                    query = `SELECT token FROM usuario WHERE  id = 1`
                    let [dataToken] = await con.query(query);
                    dataToken = dataToken[0];

                    query = `SELECT concat(nombres,' ',apellidos) as cliente
                         FROM venta_tmp 
                         INNER JOIN cliente ON cliente.id = cliente_id 
                         WHERE  referencia = '${reference}'`

                    let [data] = await con.query(query);
                    data = data[0];
                    let body = ''

                    if (data) {
                        switch (status) {
                            case 'APPROVED':
                                body = `Transacción Aprobada del cliente ${data.cliente}`
                                query = `SELECT * FROM venta_tmp WHERE referencia = '${reference}'`
                                let [venta] = await con.query(query);
                                venta = venta[0]
                                console.log("_________________________________________________________________________________");
                                console.log(venta);

                                query = `SELECT * FROM producto_venta_tmp WHERE venta_id = '${venta.id}'`
                                let [producto_venta] = await con.query(query);
                                console.log(producto_venta);

                                query = `INSERT INTO venta VALUES(NULL,'${venta.referencia}', '${venta.transaction_id}', null, current_timestamp , current_timestamp, null , null , 1 , 1 , 1 , ${venta.cliente_id} , null,  false , '${venta.estado}',  0,  0, false, null , null , null, null, null, null, null, null , null , null, null, null, 0, 0, 0, 0, 0, null, null, 'pendiente')`;
                                let [rows] = await con.execute(query)

                                await asyncForEach(producto_venta, async (pv) => {
                                    query = `INSERT INTO producto_venta VALUES(null, ${pv.producto_id} , ${pv.cantidad}, ${pv.precio}, 0, 0,  3, ${rows.insertId}, '' )`
                                    await con.execute(query)

                                    query = `UPDATE producto_punto SET cantidad = cantidad - ${pv.cantidad} WHERE producto_id = ${pv.producto_id}`
                                    await con.execute(query)
                                });

                                break;
                            case 'DECLINED':
                                body = `Transacción Declinada del cliente ${data.cliente}`
                                break;
                            case 'VOIDED':
                                body = `Transacción Anulada del cliente ${data.cliente}`
                                break;
                            case 'ERROR':
                                body = `Transacción Error del cliente ${data.cliente}`
                                break;
                        }
                        notification.sendNotification(dataToken.token, 'Registro de venta', body, '')
                    }
                }
            }
            resolve({ status: 'success' });
        }
        resolve({ status: 'success' });

    });
}
exports.sendEmailPayment = async (transaction_id, status) => {


    let query = `SELECT 
                        producto.nombre,
                        precio,
                        cantidad,
                        producto.referencia,
                        cantidad * precio as total
                     FROM producto_venta_tmp
                     INNER JOIN producto ON producto.id = producto_id
                     INNER JOIN venta_tmp ON venta_tmp.id = venta_id
                     WHERE transaction_id = '${transaction_id}'`
    const [products] = await con.execute(query);

    query = `SELECT 
                                correo,
                                concat(nombres,' ',apellidos) as nombres
                            FROM venta_tmp 
                            INNER JOIN cliente ON cliente_id = cliente.id
                            WHERE transaction_id = '${transaction_id}'`

    console.log("---------------------query-------------------");
    console.log(query);
    let [cliente] = await con.execute(query);
    cliente = cliente[0];

    let data = {
        to: cliente.correo,
        products: products,
        cliente: `${cliente.nombres}`

    }
    console.log("----------------cliente-----------------");
    console.log(cliente)
    if (status === 'APPROVED')
        mailer.sendEmailSuccess(data);
    else
        mailer.sendEmailError(data);



}
const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}