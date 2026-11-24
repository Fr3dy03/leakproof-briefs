import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pay to unlock a brief · Fiber Testnet',
  description:
    'A browser-only pay-to-unlock demo: a free preview, a sealed brief, and a 1 CKB Fiber Testnet invoice that releases the AES key.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
