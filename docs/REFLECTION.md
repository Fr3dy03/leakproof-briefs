# Reflection — Build on CKB Campaign #8

 Written from the actual run recorded in
`docs/screenshots/` and `docs/ADVANCED-RUN.md`.

## explanations alongside each interactive step
This was my first Fiber tutorial, and having the explanation pinned to the step it describes is the reason I
finished it in one sitting. Because the demo and the write-up are the same column, I never had to remember
which state I was looking at: the paragraph about `CHANNEL_READY` sat directly under the two channel cards that
were still opening, and the sentence about the preimage sat next to the button that used it. The cost is that
it's linear. Halfway through I wanted to check the funding addresses again and had to scroll back past
everything, and there's no way to jump straight to one concept like last-hop hints. Good for a first pass,
mildly annoying for a second.

## What stood out about paying to unlock
That the buyer holds the ciphertext before paying anything and learns nothing from it. No key is delivered —
the key *is* the invoice's preimage, so the value that proves payment is the value that decrypts. Seeing the
receipt say 1 CKB plus 0.001 fee next to a document that then opened locally made it click in a way the prose
hadn't.

## A step where I was unsure
Why each node needed over 500 CKB on chain when the report costs 1 CKB, and why the seller needs capacity on
Bottle's side to be paid at all. "Inbound liquidity" only made sense after I watched the B–C bar move on
payment: whether the seller can receive depends on the other side of the channel, not on the seller's own
balance.

## A problem and how I resolved it
While rebuilding the flow, a channel open failed with "Peer Pubkey(…)'s feature not found, waiting for peer to
send Init message." I expected the open to work as soon as the peer was connected. It wasn't — the transport
was up before Bottle had exchanged its features. Retrying once the handshake finished worked, and I ended up
automating exactly that retry instead of telling the user to click twice.

## If I could change one thing
Show the invoice's payment hash next to the invoice before paying, and make "pending" and "failed"
unmistakable. The recovery rules depend on that difference — a pending payment must be checked, not resent —
and the UI never teaches it.
