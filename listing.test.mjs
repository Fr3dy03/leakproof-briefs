import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buyerHandleFromIdentifier,
  buyerHandlePattern,
  ciphertextBytes,
  cleanListing,
  listingLimits,
  readBuyerHandle,
  readListing,
  sampleBrief,
} from './lib/listing.ts';

test('the shipped sample brief is valid for sealing', () => {
  const listing = cleanListing(sampleBrief);
  assert.equal(listing.title, sampleBrief.title.trim());
  assert.ok(sampleBrief.preview.length <= listingLimits.preview);
  assert.ok(listing.title.length <= listingLimits.title);
  assert.ok(listing.seller.length <= listingLimits.seller);
});

test('a listing is trimmed and a missing preview becomes empty', () => {
  const listing = readListing({ seller: '  Fiber Desk ', title: ' A brief ', preview: undefined });
  assert.deepEqual(listing, { seller: 'Fiber Desk', title: 'A brief', preview: '' });
});

test('a sealed copy needs a full brief body', () => {
  assert.throws(() => cleanListing({ ...sampleBrief, body: '   ' }), /Write the full brief/);
});

test('listing fields are required and length-capped', () => {
  const valid = { seller: 'Desk', title: 'Title', preview: 'Preview' };
  for (const bad of [null, [], 'text']) {
    assert.throws(() => readListing(bad), /public brief details/);
  }
  assert.throws(() => readListing({}), /Seller name is missing/);
  assert.throws(() => readListing({ ...valid, seller: ' ' }), /name a seller/);
  assert.throws(() => readListing({ ...valid, title: '' }), /brief title/);
  assert.throws(() => readListing({ ...valid, title: 'x'.repeat(listingLimits.title + 1) }), /80 characters/);
  assert.throws(() => readListing({ ...valid, preview: 'x'.repeat(listingLimits.preview + 1) }), /400 characters/);
  assert.throws(() => readListing({ ...valid, seller: 42 }), /Seller name is missing/);
});

test('buyer handles are exactly eight hex characters', () => {
  assert.equal(readBuyerHandle(' 3F9A2C1D '), '3f9a2c1d');
  for (const bad of ['3f9a2c1', '3f9a2c1d0', 'zzzzzzzz', '', 12, null]) {
    assert.throws(() => readBuyerHandle(bad), /8 hexadecimal characters/);
  }
});

test('a saved node identifier yields a public buyer handle', () => {
  assert.equal(buyerHandleFromIdentifier('3f9a2c1d-1111-4222-8333-444455556666'), '3f9a2c1d');
  assert.match(buyerHandleFromIdentifier('ABCDEF01-1111-4222-8333-444455556666'), buyerHandlePattern);
  assert.equal(buyerHandleFromIdentifier('not-a-uuid'), '');
});

test('ciphertext size is reported in bytes', () => {
  assert.equal(ciphertextBytes('0xdeadbeef'), 4);
  assert.equal(ciphertextBytes('0x'), 0);
});
