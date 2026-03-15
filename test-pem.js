require('dotenv').config({ path: '.env.local' });
try {
  const raw = process.env.FIREBASE_PRIVATE_KEY || '';
  console.log("Raw:", JSON.stringify(raw.substring(0, 50)));
  let parsed = raw.split('\\n').join('\n').replace(/"/g, '');
  console.log("Parsed:", JSON.stringify(parsed.substring(0, 50)));
} catch (e) {
  console.error("Error:", e);
}
