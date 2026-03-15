/**
 * Luna API v1 — End-to-End Test Script
 * 
 * Tests all API endpoints with a real API key.
 * Run: npx ts-node scripts/test-api.ts
 * 
 * Set environment variables:
 *   API_BASE=http://localhost:3000
 *   API_KEY=lk_your_test_key
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || '';

interface TestResult {
    name: string;
    pass: boolean;
    status?: number;
    duration: number;
    error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    try {
        await fn();
        results.push({ name, pass: true, duration: Date.now() - start });
        console.log(`  ✅ ${name} (${Date.now() - start}ms)`);
    } catch (error: any) {
        results.push({ name, pass: false, duration: Date.now() - start, error: error.message });
        console.log(`  ❌ ${name}: ${error.message}`);
    }
}

async function api(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
    const res = await fetch(`${API_BASE}/api/v1${path}`, {
        method,
        headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return { status: res.status, data };
}

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
}

async function runTests() {
    console.log('\n🧪 Luna API v1 — E2E Tests\n');
    console.log(`  Base: ${API_BASE}`);
    console.log(`  Key: ${API_KEY ? API_KEY.substring(0, 8) + '...' : '⚠️ NOT SET'}\n`);

    if (!API_KEY) {
        console.log('❌ API_KEY not set. Set it with: API_KEY=lk_xxx npx ts-node scripts/test-api.ts');
        process.exit(1);
    }

    // ── AUTH ──
    console.log('▸ Authentication');
    await test('Reject invalid API key', async () => {
        const res = await fetch(`${API_BASE}/api/v1/contacts`, {
            headers: { 'X-API-Key': 'invalid_key' },
        });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('Reject missing API key', async () => {
        const res = await fetch(`${API_BASE}/api/v1/contacts`);
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    // ── CONTACTS ──
    console.log('\n▸ Contacts');
    let contactId = '';

    await test('GET /contacts — list', async () => {
        const { status, data } = await api('GET', '/contacts');
        assert(status === 200, `Status: ${status}`);
        assert(Array.isArray(data.data), 'data.data should be array');
        assert(typeof data.total === 'number', 'total should be number');
    });

    await test('POST /contacts — create', async () => {
        const { status, data } = await api('POST', '/contacts', {
            name: 'Test E2E Client',
            email: 'test-e2e@luna.app',
            type: 'B2C',
        });
        assert(status === 201, `Status: ${status}`);
        assert(data.data?.id, 'Should return id');
        contactId = data.data.id;
    });

    await test('GET /contacts — verify created', async () => {
        const { status, data } = await api('GET', '/contacts?limit=50');
        assert(status === 200, `Status: ${status}`);
        const found = data.data?.find((c: any) => c.id === contactId);
        assert(found, 'Created contact should be in list');
    });

    // ── TRIPS ──
    console.log('\n▸ Trips');
    let tripId = '';

    await test('POST /trips — create', async () => {
        const { status, data } = await api('POST', '/trips', {
            destination: 'Test Bali',
            clientName: 'Test E2E Client',
            travelers: 2,
        });
        assert(status === 201, `Status: ${status}`);
        assert(data.data?.id, 'Should return id');
        tripId = data.data.id;
    });

    await test('GET /trips — list with filter', async () => {
        const { status, data } = await api('GET', '/trips?status=DRAFT');
        assert(status === 200, `Status: ${status}`);
        assert(Array.isArray(data.data), 'data.data should be array');
    });

    // ── QUOTES ──
    console.log('\n▸ Quotes');

    await test('POST /quotes — create', async () => {
        const { status, data } = await api('POST', '/quotes', {
            clientName: 'Test E2E Client',
            items: [
                { description: 'Vol Test', unitPrice: 500, quantity: 2 },
                { description: 'Hotel Test', unitPrice: 150, quantity: 7 },
            ],
        });
        assert(status === 201, `Status: ${status}`);
        assert(data.data?.quoteNumber, 'Should have quoteNumber');
        assert(data.data?.totalAmount > 0, 'totalAmount should > 0');
    });

    await test('GET /quotes — list', async () => {
        const { status, data } = await api('GET', '/quotes');
        assert(status === 200, `Status: ${status}`);
    });

    // ── INVOICES ──
    console.log('\n▸ Invoices');

    await test('POST /invoices — create', async () => {
        const { status, data } = await api('POST', '/invoices', {
            clientName: 'Test E2E Client',
            items: [
                { description: 'Voyage Bali E2E', unitPrice: 2050, quantity: 1, taxRate: 20 },
            ],
        });
        assert(status === 201, `Status: ${status}`);
        assert(data.data?.invoiceNumber, 'Should have invoiceNumber');
    });

    await test('GET /invoices — list', async () => {
        const { status, data } = await api('GET', '/invoices');
        assert(status === 200, `Status: ${status}`);
    });

    // ── WEBHOOKS ──
    console.log('\n▸ Webhooks');

    await test('POST /webhooks — register', async () => {
        const { status, data } = await api('POST', '/webhooks', {
            url: 'https://httpbin.org/post',
            events: ['quote.accepted', 'invoice.paid'],
            name: 'E2E Test Hook',
        });
        assert(status === 201, `Status: ${status}`);
        assert(data.data?.secret?.startsWith('whk_'), 'Secret should start with whk_');
    });

    await test('GET /webhooks — list', async () => {
        const { status, data } = await api('GET', '/webhooks');
        assert(status === 200, `Status: ${status}`);
        assert(Array.isArray(data.data?.webhooks), 'Should return webhooks array');
    });

    await test('DELETE /webhooks — remove', async () => {
        const { status } = await api('DELETE', '/webhooks', { url: 'https://httpbin.org/post' });
        assert(status === 200, `Status: ${status}`);
    });

    // ── PAGINATION ──
    console.log('\n▸ Pagination');

    await test('GET /contacts?limit=2 — limited results', async () => {
        const { status, data } = await api('GET', '/contacts?limit=2');
        assert(status === 200, `Status: ${status}`);
        assert(data.data.length <= 2, 'Should return max 2');
    });

    await test('GET /contacts?limit=0 — invalid limit handled', async () => {
        const { status } = await api('GET', '/contacts?limit=0');
        assert(status === 200, `Status: ${status}`);
    });

    // ── REPORT ──
    console.log('\n' + '═'.repeat(50));
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    const total = results.length;
    const totalTime = results.reduce((s, r) => s + r.duration, 0);

    console.log(`\n📊 Résultats: ${passed}/${total} passés, ${failed} échecs (${totalTime}ms total)\n`);

    if (failed > 0) {
        console.log('❌ Tests échoués:');
        results.filter(r => !r.pass).forEach(r => {
            console.log(`   • ${r.name}: ${r.error}`);
        });
    }

    console.log(`\n${failed === 0 ? '✅ TOUS LES TESTS PASSÉS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ'}\n`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
