import assert from 'node:assert/strict';
import test from 'node:test';
import { decryptResult, encryptResult, fromHex, toHex } from './lib/crypto.ts';

test('a sealed copy decrypts back to the exact seller text', async () => {
  const text = 'Line one\nLine two — 1 CKB ✓\n\nemoji 🧾 and "quotes"';
  const { key, payload } = await encryptResult(text);
  assert.equal(await decryptResult(payload, key), text);
});

test('a different 32-byte key is rejected by AES-GCM authentication', async () => {
  const { payload } = await encryptResult('paid brief');
  const wrong = toHex(crypto.getRandomValues(new Uint8Array(32)));
  await assert.rejects(decryptResult(payload, wrong));
});

test('a tampered ciphertext fails closed', async () => {
  const { key, payload } = await encryptResult('paid brief');
  const flipped = payload.ciphertext.slice(0, -2) + (payload.ciphertext.endsWith('00') ? '01' : '00');
  await assert.rejects(decryptResult({ ...payload, ciphertext: flipped }, key));
});

test('each copy gets a fresh 32-byte key and 12-byte IV', async () => {
  const first = await encryptResult('same text');
  const second = await encryptResult('same text');
  assert.equal(fromHex(first.key).length, 32);
  assert.equal(fromHex(first.payload.iv).length, 12);
  assert.notEqual(first.key, second.key);
  assert.notEqual(first.payload.iv, second.payload.iv);
  assert.notEqual(first.payload.ciphertext, second.payload.ciphertext);
});

test('hex helpers round-trip bytes', () => {
  const bytes = Uint8Array.from([0, 1, 15, 16, 255]);
  assert.equal(toHex(bytes), '0x00010f10ff');
  assert.deepEqual(Array.from(fromHex(toHex(bytes))), Array.from(bytes));
});
