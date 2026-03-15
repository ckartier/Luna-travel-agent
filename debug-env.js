require('dotenv').config({ path: '.env.local' });
let pk = process.env.FIREBASE_PRIVATE_KEY || '';
console.log("Starts with quotes?", pk.startsWith('"'));
console.log("Length:", pk.length);
console.log("Contains \\n (literal slash-n)?", pk.includes('\\n'));
console.log("Contains real newlines?", pk.includes('\n'));
console.log("First 40 chars:", JSON.stringify(pk.substring(0, 40)));
console.log("Last 40 chars:", JSON.stringify(pk.substring(pk.length - 40)));
