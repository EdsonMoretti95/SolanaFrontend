import PlayerList from '@/components/PlayerList';

export default function Home() {
  return (
    <main style={{"height" : "100vh", "width" : "100vw"}}>
      <div style={{"height" : "100vh", "width" : "100vw"}}>
        <PlayerList></PlayerList>            
      </div>
    </main>
  );
}
