/** Seller-side public ledger of issued copies. No keys, ciphertext or buyer secrets. */
export const copiesKey = 'fiber-docs:paid-brief-copies-v1';
export const maxCopies = 20;

export type IssuedCopy = {
  handle: string;
  paymentHash: `0x${string}`;
  title: string;
  issuedAt: string;
};

type Reader = Pick<Storage, 'getItem'>;
type Writer = Pick<Storage, 'getItem' | 'setItem'>;

export function readCopies(storage: Reader): IssuedCopy[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(copiesKey) ?? 'null');
    if (!Array.isArray(value)) return [];
    return value
      .flatMap((entry): IssuedCopy[] => {
        if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return [];
        const { handle, paymentHash, title, issuedAt } = entry as Record<string, unknown>;
        if (typeof handle !== 'string' || !/^[0-9a-f]{8}$/.test(handle)) return [];
        if (typeof paymentHash !== 'string' || !/^0x[0-9a-f]{64}$/i.test(paymentHash)) return [];
        if (typeof title !== 'string' || !title || title.length > 80) return [];
        if (typeof issuedAt !== 'string' || Number.isNaN(Date.parse(issuedAt))) return [];
        return [{ handle, paymentHash: paymentHash.toLowerCase() as `0x${string}`, title, issuedAt }];
      })
      .slice(0, maxCopies);
  } catch {
    return [];
  }
}

export function recordCopy(storage: Writer, entry: Omit<IssuedCopy, 'issuedAt'>): IssuedCopy[] {
  // Pick fields explicitly so nothing else (a key, a ciphertext) can be cached here.
  const copy: IssuedCopy = {
    handle: entry.handle,
    paymentHash: entry.paymentHash,
    title: entry.title,
    issuedAt: new Date().toISOString(),
  };
  const next = [copy, ...readCopies(storage).filter((saved) => saved.paymentHash !== copy.paymentHash)]
    .slice(0, maxCopies);
  storage.setItem(copiesKey, JSON.stringify(next));
  return next;
}
