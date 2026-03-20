const fs = require('fs');
const glob = require('glob');

const logs = glob.sync('/Users/laurentclement/.npm/_logs/*-debug-0.log');
if (logs.length > 0) {
    const latestLog = logs.sort((a,b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
    const content = fs.readFileSync(latestLog, 'utf8');
    const lines = content.split('\n');
    const errors = lines.filter(l => l.includes('413') || l.includes('Payload Too Large') || l.includes('API resolved'));
    console.log(errors.slice(-10).join('\n'));
} else {
    console.log("No npm logs");
}
