import PlayerList from '@/components/PlayerList';

export default function Home() {
  return (
    <main style={{"height" : "100%", "width" : "100%"}}>
      <div style={{display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-start', height : "100%", width : "100%"}}>
        <PlayerList></PlayerList>            
      </div>
    </main>
  );
}
