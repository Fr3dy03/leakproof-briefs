/** A paid brief sold as one sealed copy per buyer. */
export type BriefDraft = {
  seller: string;
  title: string;
  preview: string;
  body: string;
};

export type BriefListing = Pick<BriefDraft, 'seller' | 'title' | 'preview'>;

export const listingLimits = { seller: 40, title: 80, preview: 400 } as const;

/** A buyer handle is the first 8 hex characters of that buyer node's public identifier. */
export const buyerHandlePattern = /^[0-9a-f]{8}$/;

export const sampleBrief: BriefDraft = {
  seller: 'Fiber Research Desk',
  title: 'Pay-to-unlock vs. the account paywall',
  preview:
    'Preview: a 1 CKB Fiber invoice can carry the key to a document, so a reader can buy one brief without an account, a card, or a subscription. This sample brief compares that exchange with the account paywall most publishers still use, and names exactly where the guarantee stops.',
  body: `Pay-to-unlock vs. the account paywall
A sample brief sold for 1 Testnet CKB

1. What the buyer actually gets
The seller encrypts this text with a fresh AES-256-GCM key and puts only the ciphertext and an invoice in the offer. The key itself becomes the invoice's payment preimage, so Fiber publishes sha256(key) up front and reveals the key only when the payment settles. The receipt and the disclosure are the same event.

2. Why one key per buyer matters
A single shared ciphertext and key can be forwarded once and resold forever; the seller has no way to say which buyer leaked it. Here each buyer receives their own sealed copy with its own key and its own invoice, so a leaked key can be matched to the one settlement that released it. Re-encrypting a document per buyer is cheap; losing attribution is not.

3. Why an account paywall is a different trade
A paywall trades an email and a password for access. That works, but it stores a credential, invites sharing, and needs a login flow on every device. Pay-to-unlock trades one payment for one document: no account, no session, no server that can leak a password.

4. Where the guarantee stops
A settled payment proves that the seller released this key. It does not prove the document is true, useful, or the one advertised. AES-GCM authentication is strong evidence the plaintext matches the ciphertext, not evidence about its quality. Attribution proves which buyer's invoice released a key; it does not prove who actually forwarded it.

5. What this demo does
Seller Node C seals this body separately for each buyer handle, creates a 1 CKB Testnet invoice whose preimage is that copy's key, and hands over a portable JSON offer. Buyer Node A checks that the offer is addressed to its own handle, tries to decrypt without a key and is rejected by AES-GCM authentication, pays over its Bottle channel, and imports the returned preimage to read this page.`,
};

function cleanText(value: unknown, label: string, max: number) {
  if (typeof value !== 'string') throw new Error(`${label} is missing.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return trimmed;
}

/** Validate a listing that arrived inside a public offer. */
export function readListing(value: unknown): BriefListing {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Encrypted offer is missing its public brief details.');
  }
  const source = value as Record<string, unknown>;
  const seller = cleanText(source.seller, 'Seller name', listingLimits.seller);
  const title = cleanText(source.title, 'Brief title', listingLimits.title);
  const preview = cleanText(source.preview ?? '', 'Free preview', listingLimits.preview);
  if (!seller) throw new Error('Encrypted offer does not name a seller.');
  if (!title) throw new Error('Encrypted offer does not have a brief title.');
  return { seller, title, preview };
}

/** Validate the seller's draft before anything is encrypted or invoiced. */
export function cleanListing(draft: BriefDraft): BriefListing {
  if (typeof draft.body !== 'string' || !draft.body.trim()) {
    throw new Error('Write the full brief before sealing a copy.');
  }
  return readListing({ seller: draft.seller, title: draft.title, preview: draft.preview });
}

export function readBuyerHandle(value: unknown) {
  if (typeof value !== 'string' || !buyerHandlePattern.test(value.trim().toLowerCase())) {
    throw new Error('A buyer handle is 8 hexadecimal characters, like 3f9a2c1d.');
  }
  return value.trim().toLowerCase();
}

/** Derive the public buyer handle from a saved node identifier. */
export function buyerHandleFromIdentifier(identifier: string) {
  const handle = identifier.replace(/[^0-9a-f]/gi, '').toLowerCase().slice(0, 8);
  return buyerHandlePattern.test(handle) ? handle : '';
}

export const ciphertextBytes = (ciphertextHex: string) =>
  Math.max(0, Math.floor(ciphertextHex.replace(/^0x/, '').length / 2));
