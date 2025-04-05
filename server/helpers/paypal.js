import paypal from 'paypal-rest-sdk';

paypal.configure({
    mode: "sandbox",
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_SECRET_ID,
});

export default paypal;
// Compare this snippet from client/src/context/course-context/index.jsx: