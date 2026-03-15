import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test(model, version) {
    const apiKey = process.env.GEMINI_API_KEY;
    const res = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${model}:generateEphemeralToken?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { responseModalities: ['AUDIO'] } })
    });
    console.log(`[${version}/${model}] ${res.status} ${res.statusText}`);
    console.log(await res.text());
}

async function run() {
    await test('gemini-2.0-flash-exp', 'v1alpha');
    await test('gemini-2.5-flash', 'v1alpha');
    await test('gemini-2.5-flash-preview-native-audio-dialog', 'v1alpha');
}
run();
