import {
  WalletProvider,
  ConnectionProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  AlphaWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import type { AppProps } from 'next/app';
import { useEffect, useMemo, useState } from 'react';
import { ToastContainer } from 'react-toastify';

import '@solana/wallet-adapter-react-ui/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';
import axios from 'axios';

export default function App({ Component, pageProps }: AppProps) {
  const endpoint = 'https://fancy-daphna-fast-mainnet.helius-rpc.com/';
  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      new AlphaWalletAdapter(),
      new LedgerWalletAdapter(),
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <>
      <WalletProvider wallets={wallets}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletModalProvider>
            <Component {...pageProps} />
          </WalletModalProvider>
        </ConnectionProvider>
      </WalletProvider>
      <ToastContainer position='top-center' />
    </>
  );
}
