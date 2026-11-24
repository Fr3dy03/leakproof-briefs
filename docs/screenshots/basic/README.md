# Basic quest evidence — hosted fiber.world tutorial

Tutorial: https://www.fiber.world/docs/build/encrypted-data-payment
Run: **2026-11-24**, CKB Testnet / Fiber Testnet. Everything here comes from that hosted tutorial, not from the
local app in this repo.

| File | Caption |
| --- | --- |
| `01-channels-ready.png` | Setup complete: Channel A–B (`BUYER A 400 CKB · BOTTLE B 150 CKB`) and Channel C–B (`BOTTLE B 150 CKB · SELLER C 400 CKB`), both `CHANNEL_READY`, Testnet, 2026-11-24. |
| `02-offer-and-rejected.png` | Buyer A holds the offer JSON (ciphertext, `iv`, invoice, `lastHop`); **Decrypt without key** was rejected — "AES-GCM rejected the attempt with a substitute key". |
| `03-payment-receipt.png` | 1 CKB settled: routing fee 0.001 CKB, total paid 1.001 CKB, invoice status Paid, payment hash `0x1e431860c8ce7b8b559528bdc208fa801896b98077e2c5a5c3bb7e196f270756`. |
| `04-decrypted-result.png` | **Decrypt result**: the buyer reads the seller's original text — "Sample test report / Both nodes connected successfully. The round-trip time was 42 ms." All five lesson steps checked. |

The payment moved 1.001 CKB on A–B and credited 1 CKB on B–C: buyer side 400 → 398.999, Bottle 150 → 151.001,
Bottle → Seller 150 → 149, Seller side 400 → 401 CKB.

No keys are in these images. The tutorial displays the released AES preimage below the result box; the frame stops
above it, so the preimage is not published here even though that value is a spent Testnet demo key.

## Reproducing

Follow `docs/BASIC-WALKTHROUGH.md`. The two tutorial nodes are separate browser identities from the app in this
repo, so each needs its own faucet drip (500 CKB channel + fee each). The `#setup` anchor is handy for framing
the channel cards.
