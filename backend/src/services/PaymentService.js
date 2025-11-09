const constants = require('../config/constants');
// const request = require('request');
const request = require("request-promise");


module.exports.capturePayment = async function (appointment) {

    console.log('capturing payment' )

    const key = constants.RazorpayKey;
    const secret = constants.RazorpaySecret;

    // const key = constants.RazorpayTestKey;
    // const secret = constants.RazorpayTestSecret;

    let paymentId = appointment.paymentTransactionNo;
    let amount = appointment.consultationCharge.price * 100;
    let options = {
      method: 'POST',
      url: `https://${key}:${secret}@api.razorpay.com/v1/payments/${paymentId}/capture`,
      json: true,  
      body: {
        amount: JSON.stringify(amount),
        currency: 'INR'
      }
    }
    try {
      let result =  await request(options);
      return result;
    } catch (error) {
      console.error(error)
      return error;
    }




    // request({
    //   method: 'POST',
    //   url: `https://${key}:${secret}@api.razorpay.com/v1/payments/${paymentId}/capture`,
    //   json: true,  
    //   body: {
    //     amount: JSON.stringify(amount),
    //     currency: 'INR'
    //   }
    // }, function (error, response, body) {
    //   console.log('Status:', response.statusCode);
    //   console.log('Headers:', JSON.stringify(response.headers));
    //   console.log('Response:', body);
    // });
 
 }
