# Leakproof Briefs — one brief, one sealed copy per buyer

Submission for **Build on CKB: Campaign #8 — Unlock Encrypted Data with a Fiber Payment** (CKB DevRel).
A browser-only pay-to-unlock store on **CKB Testnet**: a seller publishes one brief with a free public
preview, and each buyer receives **their own sealed copy** — its own AES-256-GCM key, its own 1 CKB Fiber
invoice, its own payment hash. The key *is* the payment preimage, so the brief opens only when that buyer's
invoice settles, and a leaked key matches exactly one settlement.

Built from the campaign's encrypted-data-payment starter:
https://www.fiber.world/docs/build/encrypted-data-payment

## Reviewer index

| What the quest asks for | Where it is |
| --- | --- |
| Basic: proof of tutorial completion (4 shots) | [`docs/screenshots/basic/`](docs/screenshots/basic) · [`docs/BASIC-WALKTHROUGH.md`](docs/BASIC-WALKTHROUGH.md) |
| Basic: personal reflection | [`docs/REFLECTION.md`](docs/REFLECTION.md) |
| Advanced: this repo + README (what changed, how to run) | this file, [What changed from the starter](#what-changed-from-the-starter) |
| Advanced: demo proof (offer → payment → unlock) | [`docs/screenshots/leakproof/`](docs/screenshots/leakproof) · [`docs/ADVANCED-RUN.md`](docs/ADVANCED-RUN.md) |
| Advanced: how the 90-second demo is recorded | [`docs/DEMO-SCRIPT.md`](docs/DEMO-SCRIPT.md) |
| Submission map, eligibility and what to paste into CKBoost | [`docs/SUBMISSION.md`](docs/SUBMISSION.md) |

## Why this is not the tutorial renamed

The tutorial sells **one** encrypted report with **one** key, shared as one offer. That has a product
problem: one buyer can forward the key and resell the document forever, and the seller cannot say which
buyer leaked it.

This demo keeps the same Fiber primitive and changes the product:

- The seller seals **a separate copy per buyer handle**. Each copy re-encrypts the body with a fresh random
  key, and that key becomes that copy's invoice preimage.
- The offer carries `buyer.handle`. A buyer node refuses a copy addressed to someone else, so the copy is
  bound to the intended recipient at the application layer.
- The seller keeps a **public ledger** of issued copies (handle + payment hash), so a leaked key resolves to
  the single invoice that released it. Nothing secret is stored.
- The free preview stays public, so the buyer can judge the brief before paying.

That is the honest extension, and it is also where the guarantee stops: attribution proves *which invoice*
released a key, not *who* forwarded it. No reputation, refund or dispute layer is claimed.

## Interface

The demo is built to read as a product, not a dev console: warm paper stock, a serif masthead, a red wax seal that
flips to a green *Released* stamp when the payment settles, a ruled issuance register for the seller, a perforated
receipt ticket, and the unlocked brief set as a document. The sealed state renders redacted text bars rather than a
"locked" label, so the demo is legible in a single screenshot without narration.

## Flow

1. **Buyer A** starts its node and gets a public handle (first 8 hex characters of the node identifier).
2. **Seller C** writes the brief, enters that handle, and clicks *Seal a copy & create 1 CKB invoice*.
   The browser generates a 32-byte AES key + 12-byte IV, encrypts only the body, and creates a 1 CKB invoice
   with `payment_preimage` = that key (`hash_algorithm: 'sha256'`), plus the last-hop hint to the seller's
   Bottle channel.
3. The offer JSON carries the public listing (seller, title, preview), the buyer handle, ciphertext, IV,
   payment hash, encoded invoice and route hint. **Never the key.**
4. **Buyer A** validates: the offer must be addressed to its handle, and the invoice must be `Fibt`, exactly
   1 CKB, with a payment hash matching the offer.
5. *Try to read it without paying* → AES-GCM authentication fails, because the copy contains no key.
6. *Pay 1 CKB* over A → Bottle → C. On `Success`, Fiber returns `payment_preimage`.
7. *Unlock full brief* imports that preimage as the AES key and decrypts locally. The text must match what
   the seller typed.
8. To sell to a second buyer, *Seal a copy for another buyer*: a new key and a new invoice, recorded in the
   ledger under that buyer's handle.

## What changed from the starter

| Area | Starter | This demo |
| --- | --- | --- |
| `lib/listing.ts` | — | **New.** Brief model, length caps, seller-draft and incoming-offer validation, buyer-handle model (`readBuyerHandle`, `buyerHandleFromIdentifier`), ciphertext sizing, and a multi-section sample brief that explains per-buyer keys. |
| `lib/ledger.ts` | — | **New.** Validated, public-only record of issued copies (handle + payment hash + title + time, capped at 20, deduped). Only whitelisted fields are written; a passed key or ciphertext is dropped (tested). |
| `lib/offer.ts` | One opaque encrypted string | Encrypts only the body, per copy; publishes `kind: 'paid-brief'`, a validated `listing` and `buyer.handle`. `parseOffer` rejects non-brief offers, malformed listings and missing/invalid buyer handles, and re-validates the Bottle last-hop hint. Invoice description becomes `Copy for <handle>: <title>`. |
| `app/page.tsx` | One textarea → one invoice | Publish panel (name, title, preview, sealed body, buyer handle), buyer panel with the public listing, "Sealed for" badge, ciphertext size, payment hash and locked state, per-buyer ledger, and a wrong-handle refusal message. Clear action is blocked while a payment outcome is unresolved. |
| `lib/payment.ts`, `lib/payment-submission.ts`, `lib/crypto.ts`, `lib/fiber*.ts`, `lib/node-session.ts`, `lib/progress.ts` | — | **Unchanged**, including the starter's safety rules: attempt recorded before submission, restored attempts checked not resent, retry only after a verified failure, expiry blocked. `payment.test.mjs` still covers them. |
| Tests | 9 | **35** across `payment`, `crypto`, `offer`, `listing`, `ledger`. |
| Docs | Starter README | This README plus `docs/SUBMISSION.md`, `docs/BASIC-WALKTHROUGH.md`, `docs/ADVANCED-RUN.md`, `docs/REFLECTION.md`, `docs/screenshots/`. |

Two import paths in `lib/offer.ts` / `lib/fiber.ts` now carry explicit `.ts` extensions so the Node test
runner can load the same modules the app uses.

## Run it locally

Requires **Node.js 22.18+** and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3001. Use `localhost` or HTTPS: the Fiber WASM runtime needs a secure context,
`SharedArrayBuffer`, Web Locks and cross-origin isolation (`next.config.mjs` sets the COOP/COEP headers).

```sh
npm run typecheck   # tsc --noEmit
npm test            # 35 tests: crypto, listing, offer parsing, ledger, payment safety
npm run build       # production build
```

## Demo walkthrough (Testnet)

1. Start Buyer A and Seller C. Each shows a funding address; request Testnet CKB from
   https://faucet.nervos.org for **each** address.
2. Open both channels to Bottle B (500 CKB each) and refresh until both show `CHANNEL_READY`.
   Opening needs >500 CKB on chain for funding plus fee; Channel V2 reserves 100 CKB, which leaves enough to
   meet Bottle's auto-accept minimum.
3. Read Buyer A's handle, paste it into the seller's **Buyer handle** field, then *Seal a copy & create
   1 CKB invoice*. Copy the offer.
4. Optional but recommended for the recording: first seal a copy for a deliberately wrong handle and show
   Buyer A refusing it — that is the attribution property in one click.
5. Buyer A: paste, *Validate offer* → preview + "Sealed for" badge. *Try to read it without paying* →
   rejection. *Pay 1 CKB* → receipt with amount, actual fee and payment hash. *Unlock full brief* → the
   seller's text.

Testnet finishes only. If a payment is pending, use *Check payment status*; never pay again blindly.

## Security boundary

- The AES key is generated and used in the browser and only released through the payment preimage.
- The app never persists AES keys, decrypted text, or private key material. Only public offer JSON, public
  payment progress, and the public copy ledger are cached, and only for matching saved node identities.
- One tab per saved node; clearing browser storage can lose access to funded channels.
- Payment proves the key matches the ciphertext and the invoice; it proves nothing about the brief's quality.
  Attribution proves which invoice released a key; it does not prove who forwarded it.

## Verification status

Passes: `npm run typecheck`, `npm test` (**35/35**), `npm run build` (`/` prerendered).
**Not verified here:** the live Testnet flow and all screenshots — those need two funded browser nodes and
are recorded by hand. `docs/ADVANCED-RUN.md` is the place those results get filled in; until it is, treat the
Testnet half of this submission as pending.
