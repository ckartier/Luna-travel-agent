const fs = require('fs');
const jsonFile = process.argv[2] || process.env.FIREBASE_SA_JSON || 'firebase-service-account.json';
const envFile = '.env.local';

try {
    const rawData = fs.readFileSync(jsonFile, 'utf8');
    const serviceAccount = JSON.parse(rawData);
    const b64Key = Buffer.from(serviceAccount.private_key).toString('base64');
    
    let envStr = fs.readFileSync(envFile, 'utf8');
    
    // Find the exact line index of FIREBASE_PRIVATE_KEY=
    const lines = envStr.split('\n');
    let startLine = -1;
    let endLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('FIREBASE_PRIVATE_KEY=')) {
            startLine = i;
        }
        if (startLine !== -1 && lines[i].includes('-----END PRIVATE KEY-----')) {
            endLine = i;
            break;
        }
    }
    
    if (startLine !== -1 && endLine !== -1) {
        // Remove the block
        lines.splice(startLine, endLine - startLine + 1, `FIREBASE_PRIVATE_KEY=${b64Key}`);
        fs.writeFileSync(envFile, lines.join('\n'));
        console.log(`Successfully base64 encoded FIREBASE_PRIVATE_KEY in .env.local from ${jsonFile}!`);
    } else {
        console.log("Could not find the exact bounds of the key block in .env.local.");
        // Fallback: Just append to the bottom if it was already somehow deleted or unrecognizable
        lines.push(`FIREBASE_PRIVATE_KEY=${b64Key}`);
        fs.writeFileSync(envFile, lines.join('\n'));
        console.log("Appended base64 key to bottom instead.");
    }
} catch (e) {
    console.error("Error:", e.message);
}
