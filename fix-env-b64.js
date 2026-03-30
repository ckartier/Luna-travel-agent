const fs = require('fs');

const jsonFile = process.argv[2] || process.env.FIREBASE_SA_JSON || 'firebase-service-account.json';
const envFile = '.env.local';

try {
    const rawData = fs.readFileSync(jsonFile, 'utf8');
    const serviceAccount = JSON.parse(rawData);
    
    // Base64 encode the private key
    const b64Key = Buffer.from(serviceAccount.private_key).toString('base64');
    
    let envStr = fs.readFileSync(envFile, 'utf8');
    const startIdx = envStr.indexOf('FIREBASE_PRIVATE_KEY=');
    const endIdx = envStr.indexOf('GEMINI_API_KEY=');
    
    if (startIdx !== -1 && endIdx !== -1) {
        envStr = envStr.substring(0, startIdx) + `FIREBASE_PRIVATE_KEY=${b64Key}\n\n` + envStr.substring(endIdx);
        fs.writeFileSync(envFile, envStr);
        console.log(`Successfully base64 encoded FIREBASE_PRIVATE_KEY in .env.local from ${jsonFile}`);
}
} catch (e) {
    console.error("Error:", e.message);
}
