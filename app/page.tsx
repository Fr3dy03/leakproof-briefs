'use client';

import { channelFundingGuidance } from '../lib/channel-funding';
import { useEffect, useRef, useState } from 'react';
import { scriptToAddress, type Channel, type FiberBrowserNode, type GetPaymentResult } from '@fiber-pay/sdk/browser';
import { decryptResult, toHex } from '../lib/crypto';
import { bottle, channelFundingCkb, connectAndOpenChannel, readChannel, ready, startRole } from '../lib/fiber';
import { buyerHandleFromIdentifier, ciphertextBytes, readBuyerHandle, sampleBrief, type BriefDraft } from '../lib/listing';
import { readCopies, recordCopy, type IssuedCopy } from '../lib/ledger';
import { createOffer, parseOffer, type EncryptedOffer } from '../lib/offer';
import { payForOffer, validateOffer } from '../lib/payment';
import { createBrowserNodeSession } from '../lib/node-session';
import { encryptedSessionKey, encryptedBuyerProfile, encryptedSellerProfile, savedNodeIdentifier, readEncryptedProgress, type EncryptedLessonProgress } from '../lib/progress';

type Role = 'buyer' | 'seller';
const ckb = (value: string) => `${Number(BigInt(value)) / 100_000_000}`;
const price = '1 CKB';

export default function Page() {
  const nodes = useRef<Partial<Record<Role, FiberBrowserNode>>>({});
  const sessions = useRef<Partial<Record<Role, ReturnType<typeof createBrowserNodeSession>>>>({});
  const progress = useRef<EncryptedLessonProgress | null>(null);
  const locked = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addresses, setAddresses] = useState<Partial<Record<Role, string>>>({});
  const [connected, setConnected] = useState<Partial<Record<Role, boolean>>>({});
  const [channels, setChannels] = useState<Partial<Record<Role, Channel>>>({});
  const [draft, setDraft] = useState<BriefDraft>(sampleBrief);
  const [buyerInput, setBuyerInput] = useState('');
  const [myHandle, setMyHandle] = useState('');
  const [copies, setCopies] = useState<IssuedCopy[]>([]);
  const [generated, setGenerated] = useState('');
  const [received, setReceived] = useState('');
  const [offer, setOffer] = useState<EncryptedOffer | null>(null);
  const [attempt, setAttempt] = useState('');
  const [tested, setTested] = useState(false);
  const [payment, setPayment] = useState<GetPaymentResult | null>(null);
  const [key, setKey] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = readEncryptedProgress(sessionStorage, localStorage);
    progress.current = saved;
    if (saved) { setGenerated(saved.generatedOffer); setReceived(saved.buyerOfferText); setAttempt(saved.attemptedPaymentHash); setTested(saved.triedWithoutKey); }
    setCopies(readCopies(sessionStorage));
    const buyerId = savedNodeIdentifier(localStorage, encryptedBuyerProfile);
    if (buyerId) setMyHandle(buyerHandleFromIdentifier(buyerId));
    setLoaded(true);
    const owned = sessions.current;
    const stop = () => { for (const session of Object.values(owned)) void session.stop().catch(() => {}); };
    window.addEventListener('pagehide', stop);
    return () => { window.removeEventListener('pagehide', stop); stop(); nodes.current = {}; sessions.current = {}; };
  }, []);

  function save(update: Partial<EncryptedLessonProgress>) {
    const buyerId = savedNodeIdentifier(localStorage, encryptedBuyerProfile);
    const sellerId = savedNodeIdentifier(localStorage, encryptedSellerProfile);
    if (!buyerId || !sellerId) throw new Error('Start both saved nodes before continuing.');
    const next = { version: 1 as const, buyerId, sellerId, generatedOffer: '', buyerOfferText: '', attemptedPaymentHash: '', triedWithoutKey: false, ...progress.current, ...update };
    sessionStorage.setItem(encryptedSessionKey, JSON.stringify(next));
    progress.current = next;
  }

  async function run(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await action(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Action failed. Check status before retrying a transfer.'); }
    finally { locked.current = false; setBusy(false); }
  }

  async function refresh(role: Role) {
    const node = nodes.current[role];
    if (!node) return;
    const channel = await readChannel(node);
    const { peers } = await node.listPeers();
    setConnected((previous) => ({ ...previous, [role]: peers.some(peer => peer.pubkey.replace(/^0x/i, '').toLowerCase() === bottle.pubkey.slice(2)) }));
    setChannels((previous) => ({ ...previous, [role]: channel }));
  }

  async function start(role: Role) {
    if (nodes.current[role]) return;
    const session = sessions.current[role] ??= createBrowserNodeSession();
    let started: FiberBrowserNode | undefined;
    await session.start(role === 'buyer' ? encryptedBuyerProfile : encryptedSellerProfile, async (track) => {
      started = await startRole(role, track);
    });
    if (!started) return;
    nodes.current[role] = started;
    const info = await started.nodeInfo();
    setAddresses((previous) => ({ ...previous, [role]: scriptToAddress(info.default_funding_lock_script, 'testnet') }));
    if (role === 'buyer') {
      const id = savedNodeIdentifier(localStorage, encryptedBuyerProfile);
      if (id) setMyHandle(buyerHandleFromIdentifier(id));
    }
    if (await readChannel(started)) await started.connectPeer(bottle);
    await refresh(role);
  }

  async function openChannel(role: Role) {
    const node = nodes.current[role];
    if (!node) return;
    const channel = await connectAndOpenChannel(node);
    setChannels((previous) => ({ ...previous, [role]: channel }));
    await refresh(role);
    setStatus(channel && ready(channel) ? 'Channel ready.' : 'Opening submitted. Check channel status after confirmation.');
  }

  async function moveLiquidity() {
    const node = nodes.current.seller;
    if (!node) return;
    const id = savedNodeIdentifier(localStorage, encryptedSellerProfile);
    const storageKey = `fiber-docs:encrypted-inbound:${id}`;
    const existing = sessionStorage.getItem(storageKey);
    if (existing === 'submitting') throw new Error('Transfer outcome unknown. Review payment history before sending again.');
    let result: GetPaymentResult;
    if (existing) result = await node.getPayment({ payment_hash: existing as `0x${string}` });
    else {
      sessionStorage.setItem(storageKey, 'submitting');
      result = await node.sendPayment({ target_pubkey: bottle.pubkey, amount: '0x1dcd65000', keysend: true });
      sessionStorage.setItem(storageKey, result.payment_hash);
    }
    if (!['Success', 'Failed'].includes(result.status)) result = await node.waitForPayment(result.payment_hash, { timeout: 60_000, interval: 1_000 });
    if (result.status === 'Failed') sessionStorage.removeItem(storageKey);
    setStatus(`Liquidity transfer: ${result.status}`);
    await refresh('seller');
  }

  async function sealCopy() {
    if (!nodes.current.seller || !channels.seller || !routeReady || generated || attempt) return;
    const handle = readBuyerHandle(buyerInput);
    const value = await createOffer(nodes.current.seller, channels.seller, draft, handle);
    const sealed = parseOffer(value);
    save({ generatedOffer: value });
    setGenerated(value);
    setCopies(recordCopy(sessionStorage, { handle, paymentHash: sealed.paymentHash, title: sealed.listing.title }));
    setStatus(`Sealed a copy for ${handle}.`);
  }

  async function validate() {
    if (!nodes.current.buyer) return;
    const parsed = parseOffer(received);
    const mine = myHandle || buyerHandleFromIdentifier(savedNodeIdentifier(localStorage, encryptedBuyerProfile) ?? '');
    if (!mine) throw new Error('Start your buyer node first so this app can read your handle.');
    if (parsed.buyer.handle !== mine) {
      throw new Error(`This copy was sealed for ${parsed.buyer.handle}, not for you (${mine}). Ask the seller for a copy issued to your handle.`);
    }
    await validateOffer(nodes.current.buyer, parsed);
    if (attempt && parsed.paymentHash.toLowerCase() !== attempt.toLowerCase()) throw new Error('Restore the offer for the previous payment.');
    save({ buyerOfferText: received }); setOffer(parsed); setStatus(`Offer validated for ${mine}. The preview is public; the full brief is sealed.`);
  }

  async function testLock() {
    if (!offer) return;
    try { await decryptResult(offer, toHex(crypto.getRandomValues(new Uint8Array(32)))); }
    catch { save({ triedWithoutKey: true }); setTested(true); setStatus('Decryption rejected: this copy carries no key.'); }
  }

  async function pay() {
    if (!nodes.current.buyer || !offer || !tested || !routeReady) return;
    const result = await payForOffer(nodes.current.buyer, offer, attempt, (hash) => {
      save({ attemptedPaymentHash: hash }); setAttempt(hash);
    }, payment?.status === 'Failed');
    acceptPayment(result);
    await Promise.all([refresh('buyer'), refresh('seller')]);
  }

  function acceptPayment(result: GetPaymentResult) {
    setPayment(result); setStatus(`Payment: ${result.status}`);
    if (result.status === 'Failed') setError(result.failed_error ?? 'Payment failed. Check channel liquidity before retrying.');
    if (result.status === 'Success' && result.payment_preimage) setKey(result.payment_preimage);
  }

  async function checkPayment() {
    if (!nodes.current.buyer || !offer || !attempt) return;
    await validateOffer(nodes.current.buyer, offer);
    acceptPayment(await nodes.current.buyer.getPayment({ payment_hash: attempt as `0x${string}` }));
  }

  async function unlock() {
    if (!offer || !key) return;
    setDecrypted(await decryptResult(offer, key));
    setStatus(`Copy for ${offer.buyer.handle} unlocked with the payment preimage.`);
  }

  function clearOffer() {
    // Clearing only discards public screen state; never clear while a payment outcome is unknown.
    if (busy || (attempt && payment && !['Success', 'Failed'].includes(payment.status))) return;
    save({ generatedOffer: '', buyerOfferText: '', attemptedPaymentHash: '', triedWithoutKey: false, completedSteps: [] });
    setGenerated(''); setReceived(''); setOffer(null); setAttempt(''); setTested(false);
    setPayment(null); setKey(''); setDecrypted(''); setError('');
    setStatus('Issue another copy for a different buyer handle.');
  }

  const edit = (field: keyof BriefDraft) => (event: { target: { value: string } }) =>
    setDraft((previous) => ({ ...previous, [field]: event.target.value }));
  const routeReady = Boolean(connected.buyer && connected.seller && channels.buyer && ready(channels.buyer) && BigInt(channels.buyer.local_balance) >= 100_000_000n && channels.seller && ready(channels.seller) && BigInt(channels.seller.remote_balance) >= 100_000_000n);
  const canSubmit = Boolean(offer && tested && routeReady && !key && (!attempt || payment?.status === 'Failed'));

  return <main>
    <header className="masthead">
      <p className="kicker">Fiber Testnet · Build on CKB 08</p>
      <h1>One brief.<br /><em>One sealed copy per buyer.</em></h1>
      <p className="lead">Seller C seals the full text once for every buyer handle. Each copy carries its own AES-256-GCM key, and that key is the preimage of that buyer&apos;s own 1 CKB invoice — so a leaked key resolves to exactly one settlement.</p>
      <dl className="masthead-meta">
        <div><dt>Price</dt><dd>{price}</dd></div>
        <div><dt>Cipher</dt><dd>AES-256-GCM</dd></div>
        <div><dt>Copies issued</dt><dd>{String(copies.length).padStart(2, '0')}</dd></div>
        <div><dt>Network</dt><dd>Testnet</dd></div>
      </dl>
    </header>

    {status && <p className="status" role="status">{status}</p>}
    {error && <p className="error" role="alert">{error}</p>}

    <section aria-labelledby="setup-title">
      <h2 id="setup-title" className="section-title"><span className="num">01</span> Connect both nodes</h2>
      <div className="nodes">{(['buyer', 'seller'] as const).map((role) => {
        const channel = channels[role];
        const readyNow = Boolean(channel && ready(channel));
        return <article className="node" key={role}>
          <div className="node-head">
            <h3>{role === 'buyer' ? 'Buyer A' : 'Seller C'}</h3>
            <span className={readyNow ? 'pill is-ready' : 'pill'}>{channel ? channel.state.state_name : addresses[role] ? 'funding' : 'idle'}</span>
          </div>
          <p className="node-sub">{role === 'buyer' ? 'Pays one invoice per copy' : 'Seals and invoices each copy'}</p>
          {!addresses[role] && <button className="primary" disabled={!loaded || busy} onClick={() => void run(() => start(role))}>Start node</button>}
          {addresses[role] && <>
            <p className="label">Funding address</p>
            <code className="address">{addresses[role]}</code>
            <a href="https://faucet.nervos.org" target="_blank" rel="noreferrer">Get Testnet CKB ↗</a>
            {!channel && <p className="hint">{channelFundingGuidance}</p>}
            <div className="button-row">
              <button disabled={busy} onClick={() => void run(() => openChannel(role))}>{channel ? 'Reconnect / check channel' : `Open ${channelFundingCkb} CKB channel`}</button>
              <button disabled={busy} onClick={() => void run(() => refresh(role))}>Refresh status</button>
            </div>
          </>}
          {channel && <p className="balances">local {ckb(channel.local_balance)} CKB · Bottle {ckb(channel.remote_balance)} CKB</p>}
          {role === 'buyer' && myHandle && <p className="handle"><span>Your buyer handle</span><code>{myHandle}</code></p>}
        </article>;
      })}</div>
      <div className="route">
        <span className="route-node">Buyer A</span>
        <span className="route-link">direct channel</span>
        <span className="route-node">Bottle B</span>
        <span className="route-link">last-hop hint</span>
        <span className="route-node">Seller C</span>
      </div>
    </section>

    <section className="slim">
      <p><strong>Inbound liquidity.</strong> Moves 5 CKB toward Bottle so Seller C can receive. Skip it if Bottle already holds capacity for this purchase.</p>
      <button disabled={busy || !channels.seller || !ready(channels.seller) || BigInt(channels.seller.local_balance) < 500_000_000n} onClick={() => void run(moveLiquidity)}>Send / check 5 CKB transfer</button>
    </section>

    <div className="workbench">
      <section className="panel">
        <div className="panel-head">
          <h2><span className="num">02</span> Seal desk</h2>
          <p className="hint">Write once. Seal a distinct copy for each buyer handle.</p>
        </div>
        <div className="fields">
          <label>Seller name<input aria-label="Seller name" maxLength={40} disabled={busy || Boolean(generated)} value={draft.seller} onChange={edit('seller')} /></label>
          <label>Brief title<input aria-label="Brief title" maxLength={80} disabled={busy || Boolean(generated)} value={draft.title} onChange={edit('title')} /></label>
          <label>Free preview · public<textarea aria-label="Free preview" maxLength={400} disabled={busy || Boolean(generated)} value={draft.preview} onChange={edit('preview')} /></label>
          <label>Full brief · sealed per copy<textarea aria-label="Full brief" disabled={busy || Boolean(generated)} value={draft.body} onChange={edit('body')} /></label>
          <label>Buyer handle · 8 hex characters<input aria-label="Buyer handle" maxLength={8} placeholder="3f9a2c1d" disabled={busy || Boolean(generated)} value={buyerInput} onChange={e => setBuyerInput(e.target.value)} /></label>
        </div>
        <button className="primary wide" disabled={busy || !routeReady || !draft.title.trim() || !draft.body.trim() || buyerInput.trim().length !== 8 || Boolean(generated || attempt)} onClick={() => void run(sealCopy)}>Seal a copy &amp; create 1 CKB invoice</button>
        <label>Offer for the buyer<textarea className="output" aria-label="Generated offer" readOnly placeholder="Seal a copy to produce the offer JSON" value={generated} /></label>
        <button disabled={!generated || busy} onClick={() => void run(async () => { await navigator.clipboard.writeText(generated); setStatus('Offer copied.'); })}>Copy offer</button>
        {copies.length > 0 && <div className="register">
          <div className="register-head"><h3>Issuance register</h3><span>{copies.length} issued</span></div>
          <ol>{copies.map((copy, index) => <li key={copy.paymentHash}>
            <span className="num">{String(index + 1).padStart(2, '0')}</span>
            <code>{copy.handle}</code>
            <code className="hash">{copy.paymentHash.slice(0, 16)}…</code>
          </li>)}</ol>
          <p className="hint">Each row is one key and one invoice. A shared key matches exactly one row.</p>
        </div>}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2><span className="num">03</span> Buyer dossier</h2>
          <p className="hint">Validate the copy, read the preview, pay to unseal.</p>
        </div>
        {!myHandle && <p className="hint">Start your node to get the handle the seller must seal a copy for.</p>}
        <textarea aria-label="Received offer" placeholder="Paste the offer JSON the seller sent you" disabled={busy || Boolean(offer || attempt)} value={received} onChange={e => { setReceived(e.target.value); setTested(false); }} />
        <button className="primary" disabled={busy || !received || !addresses.buyer || Boolean(offer)} onClick={() => void run(validate)}>Validate offer</button>

        {!offer && <article className="dossier specimen" aria-hidden="true">
          <div className="dossier-top"><span>Specimen</span><span>{price}</span></div>
          <h3>Your copy appears here</h3>
          <p className="dossier-seller">Sealed for your handle · AES-256-GCM</p>
          <p className="kicker small">Free preview</p>
          <p className="preview">The seller&apos;s preview stays readable before payment. The full text does not.</p>
          <div className="seal-strip"><span className="stamp">Sealed</span><span>— bytes · AES-256-GCM</span></div>
          <div className="redacted"><span /><span /><span /></div>
          <p className="fingerprint">payment hash · —</p>
        </article>}

        {offer && <article className={key ? 'dossier is-open' : 'dossier is-sealed'}>
          <div className="dossier-top">
            <span>Copy {offer.paymentHash.slice(2, 6).toUpperCase()}</span>
            <span>{price}</span>
          </div>
          <h3>{offer.listing.title}</h3>
          <p className="dossier-seller">{offer.listing.seller} · sealed for <code>{offer.buyer.handle}</code></p>
          <p className="kicker small">Free preview</p>
          <p className="preview">{offer.listing.preview || 'No preview supplied.'}</p>
          <div className="seal-strip">
            <span className="stamp">{key ? 'Released' : 'Sealed'}</span>
            <span>{ciphertextBytes(offer.ciphertext)} bytes · AES-256-GCM</span>
          </div>
          {!key && <div className="redacted" aria-hidden="true"><span /><span /><span /></div>}
          <p className="fingerprint">payment hash <code>{offer.paymentHash}</code></p>
          <p className={key ? 'unlocked' : 'locked'}>{key ? 'Preimage revealed by the settled payment.' : 'Locked: this copy contains no key.'}</p>
        </article>}

        {tested && !key && <p className="rejected">Decryption rejected: this copy carries no key.</p>}
        <div className="button-row">
          {!tested && <button disabled={busy || !offer} onClick={() => void run(testLock)}>Try to read it without paying</button>}
          {canSubmit && <button className="primary" disabled={busy} onClick={() => void run(pay)}>{attempt ? 'Retry failed payment' : `Pay ${price}`}</button>}
          {attempt && !key && <button disabled={busy || !offer || !addresses.buyer} onClick={() => void run(checkPayment)}>Check payment status</button>}
          <button disabled={busy || !offer || !key || Boolean(decrypted)} onClick={() => void run(unlock)}>Unlock full brief</button>
        </div>
      </section>
    </div>

    {payment?.status === 'Success' && <section className="ticket">
      <div className="ticket-top">
        <div><p className="kicker">Payment receipt</p><p className="ticket-amount">1<span>CKB</span></p></div>
        <span className="stamp settled">Settled</span>
      </div>
      <dl className="ticket-rows">
        <div><dt>Fee</dt><dd>{ckb(payment.fee)} CKB</dd></div>
        <div><dt>Total</dt><dd>{ckb(`0x${(100_000_000n + BigInt(payment.fee)).toString(16)}`)} CKB</dd></div>
        <div><dt>Payment hash</dt><dd>{payment.payment_hash}</dd></div>
        <div><dt>Buyer handle</dt><dd>{offer?.buyer.handle}</dd></div>
      </dl>
      <p className="hint">This invoice released this copy&apos;s key, and no other. Attribution stops at the invoice: it does not prove who forwarded a key.</p>
    </section>}

    {decrypted && <section className="document">
      <p className="kicker">Unsealed · {offer?.buyer.handle}</p>
      <h2>{offer?.listing.title}</h2>
      <p className="document-body">{decrypted}</p>
      <p className="hint">Decrypted locally in the buyer&apos;s browser with the preimage Fiber returned for invoice {offer?.paymentHash.slice(0, 14)}…</p>
    </section>}

    {generated && (!attempt || (payment && ['Success', 'Failed'].includes(payment.status))) && <button className="wide" disabled={busy} onClick={() => void run(async () => clearOffer())}>Seal a copy for another buyer</button>}
  </main>;
}
