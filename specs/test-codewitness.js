/**
 * Manual tests for CodeWitness verification of dsh-local-ai
 * These tests can be run independently to verify core functionality
 */

const assert = require('assert');

// Test 1: Sanitize function - URL redaction
function testSanitizesUrl() {
  const { sanitize } = require('../src/sanitize.ts');
  const result = sanitize('http://user:secret@example.com/path');
  assert.ok(result.includes('example.com'), 'Should keep domain');
  assert.ok(!result.includes('user'), 'Should redact username');
  assert.ok(!result.includes('secret'), 'Should redact password');
  console.log('✓ testSanitizesUrl passed');
}

// Test 2: Sanitize function - path redaction
function testSanitizesPath() {
  const { sanitize } = require('../src/sanitize.ts');
  const result = sanitize('/home/user/.ollama/models/llama3.2');
  assert.ok(!result.includes('/home/'), 'Should redact home path');
  console.log('✓ testSanitizesPath passed');
}

// Test 3: Config validation - valid config
function testValidConfig() {
  const { resolveConfig } = require('../src/config.ts');
  const config = resolveConfig({
    baseURL: 'http://127.0.0.1:11434',
    requestTimeoutMs: 30000,
    model: { llama3: 'llama3' }
  });
  assert.ok(config, 'Should resolve valid config');
  assert.strictEqual(config.baseURL, 'http://127.0.0.1:11434');
  console.log('✓ testValidConfig passed');
}

// Test 4: Config validation - invalid URL
function testInvalidConfig() {
  const { resolveConfig } = require('../src/config.ts');
  try {
    resolveConfig({ baseURL: 'not-a-url' });
    assert.fail('Should throw on invalid URL');
  } catch (err) {
    assert.ok(err.message.includes('valid'), 'Error should mention valid');
    console.log('✓ testInvalidConfig passed');
  }
}

// Test 5: Route matching - keyword
function testRouteByKeyword() {
  const { routeRequest } = require('../src/route.ts');
  const result = routeRequest({
    message: 'This is confidential data',
    rules: [{
      model: 'llama3.2',
      keywords: ['confidential']
    }]
  });
  assert.strictEqual(result.provider, 'ollama');
  assert.strictEqual(result.model, 'llama3.2');
  console.log('✓ testRouteByKeyword passed');
}

// Test 6: Route matching - no match falls through
function testRouteNoMatch() {
  const { routeRequest } = require('../src/route.ts');
  const result = routeRequest({
    message: 'Hello world',
    rules: [{
      model: 'llama3.2',
      keywords: ['confidential']
    }]
  });
  assert.strictEqual(result.provider, null);
  console.log('✓ testRouteNoMatch passed');
}

// Test 7: Message serialization - text only
function testSerializeTextMessage() {
  const { serializeMessage } = require('../src/serialize.ts');
  const result = serializeMessage({
    role: 'user',
    content: [{ type: 'text', text: 'hello' }]
  });
  assert.strictEqual(result.role, 'user');
  assert.strictEqual(result.content, 'hello');
  console.log('✓ testSerializeTextMessage passed');
}

// Run all tests
const tests = [
  testSanitizesUrl,
  testSanitizesPath,
  testValidConfig,
  testInvalidConfig,
  testRouteByKeyword,
  testRouteNoMatch,
  testSerializeTextMessage
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    test();
    passed++;
  } catch (err) {
    console.error(`✗ ${test.name} failed:`, err.message);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
