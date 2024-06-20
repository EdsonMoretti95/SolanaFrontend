import PlayerList from '@/components/PlayerList';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  return (
    <main className='flex items-center justify-center h-screen mx-11'>
      <div className='bg-gray-300 rounded border shadow-xl min-w-full'>
        <div className='flex items-center justify-center'>
          <div className='mb-12 p-2'>
            <WalletMultiButtonDynamic />
          </div>
        </div>
        <PlayerList></PlayerList>
      </div>
    </main>
  );
}
