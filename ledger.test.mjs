import assert from 'node:assert/strict';
import test from 'node:test';
import { copiesKey, maxCopies, readCopies, recordCopy } from './lib/ledger.ts';

const hash = (byte) => `0x${byte.repeat(32)}`;
const storage = () => {
  const map = new Map();
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), map };
};

test('issued copies are listed newest first', () => {
  const store = storage();
  recordCopy(store, { handle: '3f9a2c1d', paymentHash: hash('aa'), title: 'First' });
  const list = recordCopy(store, { handle: 'aaaabbbb', paymentHash: hash('bb'), title: 'Second' });
  assert.deepEqual(list.map((copy) => copy.handle), ['aaaabbbb', '3f9a2c1d']);
  assert.equal(readCopies(store).length, 2);
});

test('a copy is stored once per payment hash', () => {
  const store = storage();
  recordCopy(store, { handle: '3f9a2c1d', paymentHash: hash('aa'), title: 'Brief' });
  const list = recordCopy(store, { handle: '3f9a2c1d', paymentHash: hash('aa'), title: 'Brief' });
  assert.equal(list.length, 1);
});

test('the ledger stays public: extra fields such as a key are dropped', () => {
  const store = storage();
  recordCopy(store, {
    handle: '3f9a2c1d',
    paymentHash: hash('aa'),
    title: 'Brief',
    key: 'deadbeef',
    ciphertext: '0xdeadbeef',
  });
  const stored = store.map.get(copiesKey);
  assert.ok(!stored.includes('deadbeef'));
  assert.deepEqual(Object.keys(JSON.parse(stored)[0]).sort(), ['handle', 'issuedAt', 'paymentHash', 'title']);
});

test('malformed entries are ignored rather than rendered', () => {
  const store = storage();
  store.setItem(copiesKey, JSON.stringify([
    { handle: '3f9a2c1d', paymentHash: hash('aa'), title: 'Good', issuedAt: new Date().toISOString() },
    { handle: 'nope', paymentHash: hash('aa'), title: 'Bad handle', issuedAt: new Date().toISOString() },
    { handle: '3f9a2c1d', paymentHash: '0x1234', title: 'Bad hash', issuedAt: new Date().toISOString() },
    { handle: '3f9a2c1d', paymentHash: hash('aa'), title: '', issuedAt: new Date().toISOString() },
    { handle: '3f9a2c1d', paymentHash: hash('aa'), title: 'Bad date', issuedAt: 'not-a-date' },
    'garbage',
    null,
  ]));
  assert.deepEqual(readCopies(store).map((copy) => copy.title), ['Good']);
});

test('unreadable or oversized ledgers are treated as empty or capped', () => {
  const store = storage();
  store.setItem(copiesKey, '{not json');
  assert.deepEqual(readCopies(store), []);
  for (let index = 0; index < maxCopies + 5; index += 1) {
    recordCopy(store, { handle: '3f9a2c1d', paymentHash: hash(index.toString(16).padStart(2, '0')), title: `Brief ${index}` });
  }
  assert.equal(readCopies(store).length, maxCopies);
});
