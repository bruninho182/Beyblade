import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, query, orderByChild, limitToLast, get } from "firebase/database";

// --- 1. CONFIGURAÇÃO BLINDADA (Link do Banco Adicionado) ---
const firebaseConfig = {
  apiKey: "AIzaSyABAyy8d3qmzJ1gR0M9ykwUstyT2K71Kns",
  authDomain: "beybladeonline.firebaseapp.com",
  projectId: "beybladeonline",
  storageBucket: "beybladeonline.firebasestorage.app",
  messagingSenderId: "152863484358",
  appId: "1:152863484358:web:a888dfd532fa7896a26ac7",
  measurementId: "G-FKLQ21N2XK",
  // O link abaixo corrige o erro de conexão do console
  databaseURL: "https://beybladeonline-default-rtdb.firebaseio.com/" 
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const BEY_SHOP = [
  { id: 'p1', name: 'PEGASUS', color: '#00d4ff', price: 0, img: "beyblade.png" },
  { id: 'p2', name: 'L-DRAGO', color: '#ff4b2b', price: 50, img: "beyblade2.png" },
  { id: 'p3', name: 'LEONE', color: '#2ecc71', price: 100, img: "beyblade3.png" },
  { id: 'p4', name: 'QUETZAL', color: '#f1c40f', price: 150, img: "beyblade4.png" },
];

const arenas = {
  CLASSIC: { name: 'PRO STADIUM', bg: 'radial-gradient(circle, #1a1a1a 0%, #000 100%)', color: '#00d4ff', drain: 0.9 },
  ICE: { name: 'ICE TUNDRA', bg: 'radial-gradient(circle, #002b36 0%, #000 100%)', color: '#7df9ff', drain: 0.5 },
  VOLCANO: { name: 'MAGMA PIT', bg: 'radial-gradient(circle, #330000 0%, #000 100%)', color: '#ff4500', drain: 1.4 }
};

const BeybladeChampionship = () => {
  const [coins, setCoins] = useState(() => Number(localStorage.getItem('bey_coins')) || 0);
  const [userName, setUserName] = useState(() => localStorage.getItem('bey_user') || '');
  const [inventory, setInventory] = useState(() => JSON.parse(localStorage.getItem('bey_inv')) || ['p1']);
  const [selectedBey, setSelectedBey] = useState(BEY_SHOP[0]);
  const [phase, setPhase] = useState('TITLE'); 
  const [mode, setMode] = useState(null); 
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState(''); 
  const [myRole, setMyRole] = useState('p1'); 
  const [arenaType, setArenaType] = useState('CLASSIC');
  const [sparks, setSparks] = useState([]);
  const [isKOFlash, setIsKOFlash] = useState(false);
  
  const [gameState, setGameState] = useState({
    rpmP1: 50, rpmP2: 50,
    clashPos: 0, targetKey: 'A',
    status: 'LOBBY', winner: null,
    skinP1: BEY_SHOP[0].img, skinP2: BEY_SHOP[0].img,
    nameP1: 'PLAYER 1', nameP2: 'CPU',
    battleTime: 0
  });

  useEffect(() => {
    localStorage.setItem('bey_coins', coins);
    localStorage.setItem('bey_inv', JSON.stringify(inventory));
    localStorage.setItem('bey_user', userName);
  }, [coins, inventory, userName]);

  const generateLetter = useCallback(() => {
    const chars = "ABXYLRUDN";
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }, []);

  const addSparks = useCallback((pos) => {
    const isSD = gameState.battleTime >= 30;
    const newSparks = Array.from({ length: isSD ? 12 : 8 }).map(() => ({
      id: Math.random(),
      x: 50 + (pos / 25), 
      y: 50,
      vx: (Math.random() - 0.5) * (isSD ? 8 : 4),
      vy: (Math.random() - 0.5) * (isSD ? 8 : 4),
      life: 1.0,
    }));
    setSparks((prev) => [...prev, ...newSparks]);
  }, [gameState.battleTime]);

  useEffect(() => {
    if (sparks.length > 0) {
      const timer = setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.life > 0).map((s) => ({ ...s, x: s.x + s.vx, y: s.y + s.vy, life: s.life - 0.15 })));
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [sparks]);

  const joinRoom = async (id) => {
    if (!id) return alert("DIGITE UM CÓDIGO!");
    const rId = id.toUpperCase();
    const roomRef = ref(db, 'rooms/' + rId);
    
    try {
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
        await update(roomRef, { 
          skinP2: selectedBey.img, 
          nameP2: userName || 'PLAYER 2', 
          status: 'READY' 
        });
        setMyRole('p2'); setRoomId(rId); setPhase('LOBBY');
      } else {
        alert("SALA NÃO ENCONTRADA!");
      }
    } catch (err) {
      alert("ERRO AO CONECTAR!");
    }
  };

  useEffect(() => {
    if (mode === 'ONLINE' && roomId) {
      return onValue(ref(db, 'rooms/' + roomId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setGameState(data);
          if (data.status === 'BATTLE' && phase !== 'BATTLE') setPhase('BATTLE');
        }
      });
    }
  }, [mode, roomId, phase]);

  const handleKey = useCallback((e) => {
    if ((phase !== 'BATTLE' && gameState.status !== 'BATTLE') || gameState.winner) return;
    
    setGameState(prev => {
      if (e.key.toUpperCase() === prev.targetKey) {
        addSparks(prev.clashPos);
        const isSD = prev.battleTime >= 30;
        const power = isSD ? 45 : 25;
        const nextKey = generateLetter();

        if (mode === 'ONLINE') {
          const updates = {};
          if (myRole === 'p1') {
            updates['rpmP1'] = Math.min(400, prev.rpmP1 + power);
            updates['targetKey'] = nextKey;
          } else {
            updates['rpmP2'] = Math.min(400, prev.rpmP2 + power);
          }
          update(ref(db, 'rooms/' + roomId), updates);
          return prev;
        } else {
          return { ...prev, rpmP1: Math.min(400, prev.rpmP1 + power), targetKey: nextKey };
        }
      }
      return prev;
    });
  }, [phase, gameState.status, gameState.winner, mode, myRole, roomId, generateLetter, addSparks]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    if ((mode === 'ONLINE' && myRole !== 'p1') || (phase !== 'BATTLE' && gameState.status !== 'BATTLE') || gameState.winner) return;
    
    const interval = setInterval(() => {
      setGameState(prev => {
        const isSD = prev.battleTime >= 30;
        const drain = arenas[arenaType].drain * (isSD ? 2.2 : 1.0);
        const pushFactor = isSD ? 0.28 : 0.15;
        let cpuBoost = (mode === 'CPU' && Math.random() > (isSD ? 0.90 : 0.94)) ? (isSD ? 35 : 20) : 0;
        const diff = prev.rpmP1 - (prev.rpmP2 + cpuBoost);
        
        let newPos = prev.clashPos + (diff * pushFactor);
        let newWinner = null;

        if (newPos > 700 || newPos < -700) {
          setIsKOFlash(true);
          setTimeout(() => setIsKOFlash(false), 200);
          newWinner = newPos > 700 ? prev.nameP1 : prev.nameP2;
          if (newPos > 700) setCoins(c => c + 10);
        }

        const newState = {
          ...prev,
          battleTime: prev.battleTime + 0.1,
          clashPos: newPos,
          rpmP1: Math.max(0, prev.rpmP1 - 0.75 * drain),
          rpmP2: Math.max(0, prev.rpmP2 + cpuBoost - 0.75 * drain),
          winner: newWinner
        };

        if (mode === 'ONLINE') update(ref(db, 'rooms/' + roomId), newState);
        return newState;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [mode, myRole, phase, gameState.status, gameState.winner, roomId, arenaType]);

  const getShakeClass = () => {
    if (gameState.winner) return ''; 
    const absPos = Math.abs(gameState.clashPos);
    if (gameState.battleTime >= 30) return 'shake-sd'; 
    if (absPos > 600) return 'shake-hard'; 
    if (absPos > 480) return 'shake-soft';
    return '';
  };

  return (
    <div className={`game-root ${getShakeClass()}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .game-root { position: fixed; inset: 0; background: #000; color: #fff; font-family: 'Press Start 2P', cursive; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; transition: background 0.5s; }
        .shake-soft { animation: shakeEffect 0.12s infinite; }
        .shake-hard { animation: shakeEffect 0.08s infinite; background: #2a0000 !important; }
        .shake-sd { animation: shakeEffect 0.1s infinite; background: #1a0000 !important; }
        @keyframes shakeEffect { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-2px, -1px); } 100% { transform: translate(1px, 1px); } }
        .ko-flash { position: fixed; inset: 0; background: #fff; z-index: 999; pointer-events: none; animation: flashAnim 0.2s forwards; }
        @keyframes flashAnim { from { opacity: 1; } to { opacity: 0; } }
        .stadium { width: 95vw; height: 40vh; border-top: 6px solid #333; border-bottom: 6px solid #333; position: relative; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle, #222 0%, #000 100%); overflow: hidden; }
        .bey { width: 80px; height: 80px; position: absolute; z-index: 5; transition: left 0.1s linear, right 0.1s linear; display: flex; align-items: center; justify-content: center; }
        .bey img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }
        /* FALLBACK PARA IMAGEM 404 */
        .bey-fallback { width: 70px; height: 70px; border-radius: 50%; border: 4px solid #fff; box-shadow: 0 0 15px currentColor; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; }
        .panel { border: 4px solid #fff; padding: 20px; background: #111; text-align: center; box-shadow: 6px 6px 0 #c0392b; }
        .btn { padding: 10px 20px; margin: 5px; background: #000; border: 3px solid #fff; color: #fff; cursor: pointer; font-size: 10px; font-family: 'Press Start 2P'; }
      `}</style>

      {isKOFlash && <div className="ko-flash" />}

      {/* --- HUD --- */}
      {(phase === 'BATTLE' || gameState.status === 'BATTLE') && !gameState.winner && (
        <div style={{position: 'absolute', top: '35px', display: 'flex', gap: '20px', zIndex: 10}}>
           <div style={{fontSize: '8px'}}>{gameState.nameP1}</div>
           <div style={{fontSize: '12px'}}>{Math.floor(gameState.battleTime)}s</div>
           <div style={{fontSize: '8px'}}>{gameState.nameP2}</div>
        </div>
      )}

      {/* --- ARENA --- */}
      {(phase === 'BATTLE' || gameState.status === 'BATTLE') && (
        <div className={`stadium ${gameState.battleTime >= 30 ? 'active-sd' : ''}`} style={{background: arenas[arenaType].bg, borderColor: arenas[arenaType].color}}>
          {/* JOGADOR 1 */}
          <div className="bey" style={{ left: `calc(50% - 80px + ${gameState.clashPos}px)`, transform: `rotate(${Date.now() * (gameState.rpmP1/10)}deg)`, color: selectedBey.color }}>
            <img src={mode === 'ONLINE' ? gameState.skinP1 : selectedBey.img} 
                 onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            <div className="bey-fallback" style={{display: 'none', backgroundColor: selectedBey.color}}>P1</div>
            {gameState.battleTime >= 30 && <Lightning bolColor="#00d4ff" />}
          </div>

          {/* JOGADOR 2 */}
          <div className="bey" style={{ right: `calc(50% - 80px - ${gameState.clashPos}px)`, transform: `rotate(-${Date.now() * (gameState.rpmP2/10)}deg)`, color: '#ff4b2b' }}>
            <img src={gameState.skinP2} 
                 onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            <div className="bey-fallback" style={{display: 'none', backgroundColor: '#ff4b2b'}}>P2</div>
            {gameState.battleTime >= 30 && <Lightning bolColor="#ff4b2b" />}
          </div>

          {!gameState.winner && <div style={{position: 'absolute', background: '#fff', color: '#000', padding: '10px', border: '4px solid #f1c40f', fontSize: '20px', zIndex: 50}}>{gameState.targetKey}</div>}
        </div>
      )}

      {/* --- MENUS --- */}
      {phase === 'TITLE' && (
        <div className="panel">
          <h1 style={{color: '#f1c40f', fontSize: '20px'}}>BEY-CHAMPION</h1>
          <input style={{background: '#000', color: '#fff', padding: '10px', textAlign: 'center', fontFamily: "'Press Start 2P'"}} placeholder="NAME" value={userName} onChange={(e) => setUserName(e.target.value.toUpperCase())} maxLength={10} />
          <br/><br/>
          <button className="btn" onClick={() => userName ? setPhase('MODE_SELECT') : alert("ENTER NAME")}>START</button>
          <button className="btn" onClick={() => setPhase('SHOP')}>SHOP</button>
        </div>
      )}

      {phase === 'MODE_SELECT' && (
        <div className="panel">
          <button className="btn" onClick={() => { setMode('CPU'); setPhase('ARENA_SELECT'); setGameState(s => ({...s, nameP1: userName, nameP2: 'CPU'})); }}>VS CPU</button>
          <button className="btn" onClick={() => setPhase('ONLINE_MENU')}>ONLINE ROOMS</button>
        </div>
      )}

      {phase === 'LOBBY' && (
        <div className="panel">
          <h2>LOBBY</h2>
          <p style={{color: '#f1c40f'}}>CODE: {roomId}</p>
          <p style={{fontSize: '10px'}}>{gameState.status === 'LOBBY' ? "WAITING..." : "READY!"}</p>
          {myRole === 'p1' && gameState.status === 'READY' && <button className="btn" onClick={() => update(ref(db, 'rooms/' + roomId), { status: 'BATTLE' })}>START</button>}
          <button className="btn" onClick={() => setPhase('TITLE')}>CANCEL</button>
        </div>
      )}

      {phase === 'ONLINE_MENU' && (
        <div className="panel">
          <button className="btn" onClick={() => {
            const newId = Math.random().toString(36).substring(7).toUpperCase();
            setRoomId(newId); setMyRole('p1'); setMode('ONLINE');
            set(ref(db, 'rooms/' + newId), { ...gameState, skinP1: selectedBey.img, nameP1: userName || 'PLAYER 1', status: 'LOBBY' });
            setPhase('LOBBY');
          }}>CREATE ROOM</button>
          <div style={{margin: '15px 0'}}>
            <input style={{width: '100px', background: '#000', color: '#fff', border: '1px solid #fff'}} placeholder="CODE" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
            <button className="btn" onClick={() => joinRoom(joinCode)}>JOIN</button>
          </div>
          <button className="btn" onClick={() => setPhase('MODE_SELECT')}>BACK</button>
        </div>
      )}

      {phase === 'SHOP' && (
        <div className="panel">
          <h2>SHOP (💰{coins})</h2>
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center'}}>
            {BEY_SHOP.map(b => (
              <div key={b.id} style={{border: '1px solid #444', padding: '10px'}}>
                <img src={b.img} width="40" onError={(e) => e.target.style.opacity = '0.3'} />
                <p style={{fontSize: '8px'}}>${b.price}</p>
                <button className="btn" onClick={() => { setSelectedBey(b); setPhase('TITLE'); }}>{inventory.includes(b.id) ? "SELECT" : "BUY"}</button>
              </div>
            ))}
          </div>
          <button className="btn" onClick={() => setPhase('TITLE')}>BACK</button>
        </div>
      )}

      {phase === 'ARENA_SELECT' && (
        <div className="panel">
          <h2>ARENA</h2>
          {Object.keys(arenas).map(id => (
            <button key={id} className="btn" onClick={() => { setArenaType(id); setPhase('BATTLE'); setGameState(s => ({...s, status: 'BATTLE', battleTime: 0, clashPos: 0, winner: null})); }}>{arenas[id].name}</button>
          ))}
        </div>
      )}

      {gameState.winner && (
        <div className="panel" style={{position: 'absolute', zIndex: 1000}}>
          <h2 style={{color: '#f1c40f'}}>{gameState.winner} WINS!</h2>
          <button className="btn" onClick={() => window.location.reload()}>FINISH</button>
        </div>
      )}
    </div>
  );
};

const Lightning = ({ bolColor }) => (
  <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', pointerEvents: 'none' }}>
    {[...Array(4)].map((_, i) => (
      <div key={i} style={{ position: 'absolute', width: '2px', height: '40px', background: bolColor, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, boxShadow: `0 0 12px ${bolColor}`, transform: `rotate(${Math.random() * 360}deg)` }} />
    ))}
  </div>
);

export default BeybladeChampionship;