const fs = require('fs');
const dotenv = require('dotenv');

const jsonFile = process.argv[2] || process.env.FIREBASE_SA_JSON || 'firebase-service-account.json';
const envFile = '.env.local';

try {
    const rawData = fs.readFileSync(jsonFile, 'utf8');
    const serviceAccount = JSON.parse(rawData);
    
    // Read the current env file
    const envConfig = dotenv.parse(fs.readFileSync(envFile));
    
    // Inject the real private key
    envConfig.FIREBASE_PRIVATE_KEY = serviceAccount.private_key;
    
    // Serialize back to file, safely wrapping in quotes and escaping newlines
    const lines = [];
    for (const k in envConfig) {
        let val = envConfig[k];
        // If it contains newlines, wrap in quotes and escape them
        if (val.includes('\n')) {
            val = `"${val.replace(/\n/g, '\\n')}"`;
        }
        lines.push(`${k}=${val}`);
    }
    
    // But wait, dotenv.parse strips comments. If they have comments, we lose them!
    // Instead, let's just do a string splice based on the file content.
    let envStr = fs.readFileSync(envFile, 'utf8');
    
    // Remove the OLD FIREBASE_PRIVATE_KEY entirely (from FIREBASE_PRIVATE_KEY= to the end of the key block)
    // We can do this by splitting at FIREBASE_PRIVATE_KEY= and then finding the next key (e.g. GEMINI_API_KEY=)
    
    // Find where the key starts
    const startIdx = envStr.indexOf('FIREBASE_PRIVATE_KEY=');
    if (startIdx !== -1) {
        // Find the next known key to avoid deleting too much
        const endIdx = envStr.indexOf('GEMINI_API_KEY=', startIdx);
        if (endIdx !== -1) {
            const safeKey = `"` + serviceAccount.private_key.replace(/\n/g, '\\n') + `"`;
            // Reconstruct the file
            envStr = envStr.substring(0, startIdx) + `FIREBASE_PRIVATE_KEY=${safeKey}\n\n` + envStr.substring(endIdx);
            fs.writeFileSync(envFile, envStr);
            console.log(`Successfully rebuilt .env.local from ${jsonFile}`);
        } else {
            console.error("Could not find GEMINI_API_KEY in .env.local to anchor the replacement");
        }
    } else {
        console.error("Could not find FIREBASE_PRIVATE_KEY in .env.local");
    }

} catch (e) {
    console.error("Error:", e.message);
}
