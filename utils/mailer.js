exports.recoveryEmail = (cliente, confirmationCode) => {
    var nodemailer = require("nodemailer");
    nodemailer.createTestAccount((err, account) => {

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:
            {
                user: "digitaltiendaquintech@gmail.com",
                pass: "Digitalimportados"
            }
        });


        let html = `<h1>Correo de recuperación</h1>
        <h2>Hola ${cliente.nombres} ${cliente.apellidos}</h2>
        <p>Para recuperar tu cuenta ingresa al siguiente link</p>
        <a href=https://tiendaquintech.com/recoveryAccount/${confirmationCode}> Recuperar cuenta Quintech</a>
        </div>`
        let mailOptions =
        {
            from: `"Correo de recuperación" <${cliente.correo}>`,
            to: cliente.correo,
            subject: '📎',
            html,
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        })

    })
}

exports.sendEmailSuccess = (data) => {
    var nodemailer = require("nodemailer");
    const handlebars = require("handlebars");
    const fs = require("fs");
    const path = require("path");

    const emailTemplateSource = fs.readFileSync(path.join(__dirname, "/success.hbs"), "utf8")
    const template = handlebars.compile(emailTemplateSource);
    handlebars.registerHelper('incremented', function (index) {
        index++;
        return index;
    });

    let total = 0;
    data.products.map(product => {
        total += product.precio * product.cantidad;
    })
    const htmlToSend = template({
        products: data.products,
        cliente: data.cliente,
        total: new Intl.NumberFormat("de-DE").format(total)
    });


    nodemailer.createTestAccount((err, account) => {

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:
            {
                user: "digitaltiendaquintech@gmail.com",
                pass: "Digitalimportados"
            }
        });


        let html = ``
        let mailOptions =
        {
            from: `"Estado transacción tienda Quintech" <${data.to}>`,
            to: data.to,
            subject: 'Compra en Quintech',
            text: "test",
            html: htmlToSend,
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        })

    })
}

exports.sendEmailError = (data) => {
    var nodemailer = require("nodemailer");
    const handlebars = require("handlebars");
    const fs = require("fs");
    const path = require("path");

    const emailTemplateSource = fs.readFileSync(path.join(__dirname, "/error.hbs"), "utf8")
    const template = handlebars.compile(emailTemplateSource);

    const htmlToSend = template({
        cliente: data.cliente
    });


    nodemailer.createTestAccount((err, account) => {

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:
            {
                user: "digitaltiendaquintech@gmail.com",
                pass: "Digitalimportados"
            }
        });

        let mailOptions =
        {
            from: `"Error transacción tienda Quintech" <${data.to}>`,
            to: data.to,
            subject: 'Compra en Quintech',
            html: htmlToSend,
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        })

    })
}