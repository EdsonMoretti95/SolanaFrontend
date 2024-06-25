import PlayerList from '@/components/PlayerList';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  return (
    <main style={{"height" : "100vh", "width" : "100vw"}}>
      <div style={{"height" : "100vh", "width" : "100vw"}}>
        <div>
          <div>
            <WalletMultiButtonDynamic />
          </div>
        </div>
        <PlayerList></PlayerList>
      </div>
    </main>
  );
}
