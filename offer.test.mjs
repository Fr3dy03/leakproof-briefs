import assert from 'node:assert/strict';
import test from 'node:test';
import { parseOffer } from './lib/offer.ts';
import { bottle } from './lib/fiber.ts';

const hex = (byte, bytes) => `0x${byte.slice(0, 2).repeat(bytes)}`;
const base = () => ({
  version: 2,
  cipher: 'AES-256-GCM',
  kind: 'paid-brief',
  listing: { seller: 'Fiber Research Desk', title: 'Pay-to-unlock vs. the account paywall', preview: 'Free preview' },
  buyer: { handle: '3f9a2c1d' },
  ciphertext: '0xdeadbeef',
  iv: hex('11', 12),
  invoice: 'fibt1example',
  paymentHash: hex('ab', 32),
  lastHop: {
    pubkey: bottle.pubkey,
    channel_outpoint: hex('cd', 36),
    fee_rate: '0x0',
    tlc_expiry_delta: '0x0',
  },
});
const parse = (overrides = {}) => parseOffer(JSON.stringify({ ...base(), ...overrides }));

test('a per-buyer paid brief parses with its public fields normalized', () => {
  const offer = parse();
  assert.equal(offer.buyer.handle, '3f9a2c1d');
  assert.equal(offer.listing.title, 'Pay-to-unlock vs. the account paywall');
  assert.equal(offer.iv, hex('11', 12));
  assert.equal(offer.paymentHash, hex('ab', 32));
});

test('a copy addressed to another buyer is still parsed, so the buyer can name it', () => {
  assert.equal(parse({ buyer: { handle: 'AAAABBBB' } }).buyer.handle, 'aaaabbbb');
});

test('an offer without a valid buyer handle is refused', () => {
  for (const buyer of [undefined, {}, { handle: 'short' }, { handle: 'zzzzzzzz' }, null]) {
    assert.throws(() => parse({ buyer }), /buyer copy|8 hexadecimal/);
  }
});

test('offers that are not paid briefs are refused', () => {
  for (const kind of [undefined, 'hold-invoice', 'report']) {
    assert.throws(() => parse({ kind }), /not a paid brief/);
  }
});

test('a non-Fiber invoice or a bad version is refused', () => {
  assert.throws(() => parse({ invoice: 'lnbc1example' }), /Fiber testnet Invoice/);
  assert.throws(() => parse({ version: 1 }), /version 2/);
  assert.throws(() => parse({ cipher: 'AES-CBC' }), /version 2/);
});

test('the public listing is required and length-capped', () => {
  assert.throws(() => parse({ listing: undefined }), /public brief details/);
  assert.throws(() => parse({ listing: { seller: 'Desk', title: '', preview: '' } }), /brief title/);
  assert.throws(() => parse({ listing: { seller: 'Desk', title: 'T', preview: 'x'.repeat(401) } }), /400 characters/);
});

test('the last-hop hint must point at Bottle', () => {
  const lastHop = { ...base().lastHop, pubkey: hex('02', 33) };
  assert.throws(() => parse({ lastHop }), /must identify Bottle/);
  assert.throws(() => parse({ lastHop: undefined }), /Last-hop hint is missing/);
});

test('an object channel outpoint is packed into the bytes the node expects', () => {
  const offer = parse({ lastHop: { ...base().lastHop, channel_outpoint: { tx_hash: hex('aa', 32), index: 3 } } });
  assert.equal(offer.lastHop.channel_outpoint, `0x${'aa'.repeat(32)}03000000`);
});

test('malformed hex, wrong IV length and incomplete hashes are refused', () => {
  assert.throws(() => parse({ iv: hex('11', 8) }), /12 bytes/);
  assert.throws(() => parse({ paymentHash: hex('ab', 16) }), /32 bytes/);
  assert.throws(() => parse({ ciphertext: '0xabc' }), /hexadecimal/);
  assert.throws(() => parse({ lastHop: { ...base().lastHop, channel_outpoint: '0x1234' } }), /outpoint/);
});
