exports.sendNotification = (id, title, body, _data) => {

    return new Promise((resolve, reject) => {
        //let registration_ids = [id]
        //console.log( 'registration_ids', registration_ids );
        var FCM = require('fcm-node');
        var serverKey = 'AAAAoldc6aM:APA91bG6Ae-xra9CxLfrMLLCKV4HFrWxZTXNtGnsswdXDI-KJTOVdQdcCcNGYttv7rC5197uLAX4iChESf5b-UtOm-eGDdc5CAbeWGev5L10u0_sH9Ls-3HijWwd9EzB7GvWwEkoX2t4';
        var fcm = new FCM(serverKey);

        var message =
        {
            to: id,
            collapse_key: '697250408867',
            //registration_ids: registration_ids,
            notification: {
                title,
                body
            },

            data: {  //you can send only notification or only data(or include both)
                my_key: 'my value',
                my_another_key: 'my another value'
            }
            // data: {
            //     "Comida": "Comida desde postman mm"
            // }   
        };
        fcm.send(message, function (err, response) {
            if (err) {
                console.log("Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });
        // fcm.send(message, function (err, response) {
        //     if (err) {
        //         console.log(':::::::::::::::::::::response:::::::::::::::::::::::::::::::::::::')
        //         console.log(response)
        //         console.log(':::::::::::::::::::::error:::::::::::::::::::::::::::::::::::::')
        //         console.log(err)

        //         resolve({
        //             status: false,
        //             message: err
        //         })
        //     }
        //     else {
        //         resolve({
        //             status: true,
        //             message: 'Successfully sent with response:'
        //         })
        //         console.log("Successfully sent with response: ", response)
        //     }
        // })
    })

}