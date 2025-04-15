import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { CustomerProvider } from '@/contexts/CustomerContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CustomerProvider>
      <Component {...pageProps} />
    </CustomerProvider>
  );
} 