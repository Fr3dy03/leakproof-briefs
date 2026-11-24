# Reflection — working notes

The campaign requires a short reflection **in your own words**: the required question plus **at least two**
of the optional ones. Roughly 300–450 words is plenty. This file is a scaffold and a list of true
observations from building the demo — rewrite everything in your own voice before submitting. Do not paste
this file into CKBoost.

## Required: explanations alongside each interactive step

Points you can make, if they match your experience:

- The new format pins each explanation to the exact step and the exact file/lines it touches, so the
  cause and the code are adjacent instead of one scroll apart.
- The earlier live-demo-at-the-top layout meant scrolling between the demo and the walkthrough, and
  re-finding which states had changed. Here the demo *is* the walkthrough, so there is no state to re-find.
- The trade-off: the pinned format is linear. It is excellent for one guided path and harder to dip into
  when you only want one piece, like invoice creation or hop hints.
- Anything you genuinely got stuck on belongs here — vagueness reads as if you did not run it.

## Pick at least two

1. **What surprised you about paying to unlock.** Candidates: the key is not "delivered" by any server — the
   preimage is already the thing the invoice commits to, so settlement *is* delivery. Or: the ciphertext can
   sit in the buyer's hands before payment with no risk.
2. **A step where you were unsure.** Candidates: why two separate funding addresses; why the channel must
   reach `CHANNEL_READY` before paying; what the last-hop hint is for; why the payment needs a route to
   Bottle rather than a direct A→C channel.
3. **A problem and how you resolved it.** Candidates: faucet delay before the channel would open; a payment
   left pending and had to be status-checked instead of re-sent; a page needing one reload to enable WASM;
   cross-origin isolation headers missing under a proxy.
4. **What you would build with this.** Candidates: selling a per-buyer brief or dataset where a leaked key
   should still be traceable; gating an AI-generated report per customer; per-seat API or report delivery
   where each buyer's copy is distinct.
5. **One thing you would change about the tutorial.** Candidates: show the invoice's payment hash next to the
   invoice before paying; name the routing fee up front; make the difference between "pending" and "failed"
   visible in the UI, since the recovery rules depend on it.

## Facts worth citing accurately

- Seller C encrypts with AES-256-GCM; only the body is sealed, the preview is public.
- The AES key is the invoice `payment_preimage`; Fiber puts `sha256(key)` in the invoice.
- The buyer can hold the ciphertext before paying and still learn nothing.
- A settled payment returns `payment_preimage` to the payer, which is what decrypts locally.
- Where it stops: payment proves key release, not the quality or truth of the brief.

## What I built (if you use the Advanced quest)

Say plainly that you changed the tutorial's single shared key into one sealed copy per buyer, so a leaked
key maps to one settlement, and that attribution still cannot prove who forwarded it. One paragraph of
honest limits reads better than a claim of perfect leakproofing.
