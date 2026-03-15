require('dotenv').config({ path: '.env.local' });
const pk = process.env.FIREBASE_PRIVATE_KEY || '';
console.log("Length:", pk.length);
console.log("StartsWith:", pk.substring(0, 10));
console.log("Decoded head:", Buffer.from(pk, 'base64').toString('utf8').substring(0, 30));
