const fs = require('fs');

try {
  // Read the new JSON file
  const jsonContent = fs.readFileSync('luna-travel-agent-firebase-adminsdk-fbsvc-b2c7ba5ed8.json', 'utf8');
  const serviceAccount = JSON.parse(jsonContent);
  const newPrivateKey = serviceAccount.private_key;
  
  // Encode it to Base64 to safely inject it
  const base64Key = Buffer.from(newPrivateKey).toString('base64');
  
  // Read .env.local
  let envFile = fs.readFileSync('.env.local', 'utf8');
  
  // Replace the FIREBASE_PRIVATE_KEY
  // Match any multiline or single line value until the next variable or EOF
  const keyRegex = /FIREBASE_PRIVATE_KEY=[\s\S]*?(?=\n[A-Z_]+=|$(?![\r\n]))/g;
  
  if (envFile.match(keyRegex)) {
    envFile = envFile.replace(keyRegex, `FIREBASE_PRIVATE_KEY=${base64Key}`);
    fs.writeFileSync('.env.local', envFile);
    console.log("✅ Successfully updated FIREBASE_PRIVATE_KEY in .env.local with new base64 encoded key.");
  } else {
    // If not found, append it
    fs.appendFileSync('.env.local', `\nFIREBASE_PRIVATE_KEY=${base64Key}\n`);
    console.log("✅ Appended FIREBASE_PRIVATE_KEY to .env.local.");
  }
} catch (err) {
  console.error("❌ Error updating key:", err.message);
}
