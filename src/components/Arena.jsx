import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, get } from "firebase/database";

// --- 1. CONFIGURAÇÃO (MANTIDA) ---
const firebaseConfig = {
  apiKey: "AIzaSyABAyy8d3qmzJ1gR0M9ykwUstyT2K71Kns",
  authDomain: "beybladeonline.firebaseapp.com",
  projectId: "beybladeonline",
  storageBucket: "beybladeonline.firebasestorage.app",
  messagingSenderId: "152863484358",
  appId: "1:152863484358:web:a888dfd532fa7896a26ac7",
  measurementId: "G-FKLQ21N2XK",
  databaseURL: "https://beybladeonline-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- 2. ASSETS DE ÁUDIO ---
const BATTLE_MUSIC_URL = "/music.mp3"; 
const CLASH_SFX_URL = "/clash.mp3"; 
const BATTLE_MUSIC_FALLBACK = "https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race1.ogg";
const CLASH_SFX_FALLBACK = "https://rpg.hamsterrepublic.com/wiki-images/2/21/Collision8-Bit.ogg";

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

const getRank = (wins) => {
  if (wins >= 30) return { title: 'DIAMANTE', color: '#b9f2ff', icon: '💎' };
  if (wins >= 15) return { title: 'OURO', color: '#ffd700', icon: '🥇' };
  if (wins >= 5) return { title: 'PRATA', color: '#c0c0c0', icon: '🥈' };
  return { title: 'BRONZE', color: '#cd7f32', icon: '🥉' };
};

const checkAchievements = (stats) => {
  const unlocked = [];
  if (stats.wins >= 1) unlocked.push('⚔️');
  if (stats.matches >= 10) unlocked.push('🔥');
  if (stats.coins >= 100) unlocked.push('💰');
  if (stats.wins >= 50) unlocked.push('👑');
  return unlocked;
};

const BeybladeChampionship = () => {
  const [stats, setStats] = useState(() => JSON.parse(localStorage.getItem('bey_stats')) || { wins: 0, matches: 0, coins: 0 });
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
  
  // Refs
  const bgmRef = useRef(new Audio(BATTLE_MUSIC_URL));
  const sfxRef = useRef(new Audio(CLASH_SFX_URL));
  
  // TRAVA DE SEGURANÇA
  const winnerProcessedRef = useRef(false);

  const [gameState, setGameState] = useState({
    rpmP1: 50, rpmP2: 50,
    clashPos: 0, 
    targetKey: 'A',
    status: 'LOBBY', 
    winner: null, // Importante iniciar null
    skinP1: BEY_SHOP[0].img, skinP2: BEY_SHOP[0].img,
    nameP1: 'PLAYER 1', nameP2: 'CPU',
    statsP1: { wins: 0, matches: 0 },
    statsP2: { wins: 0, matches: 0 },
    battleTime: 0
  });

  // Salvar dados
  useEffect(() => {
    localStorage.setItem('bey_stats', JSON.stringify(stats));
    localStorage.setItem('bey_inv', JSON.stringify(inventory));
    localStorage.setItem('bey_user', userName);
    localStorage.setItem('bey_coins', stats.coins);
  }, [stats, inventory, userName]);

  // RESET DO JUIZ: Só destrava quando o vencedor for limpo (null)
  useEffect(() => {
    if (!gameState.winner) {
      winnerProcessedRef.current = false;
    }
  }, [gameState.winner]);

  // O JUIZ: Contabiliza vitória
  useEffect(() => {
    // Se existe um vencedor E eu ainda não processei essa vitória E meu nome está definido
    if (gameState.winner && !winnerProcessedRef.current && userName) {
       winnerProcessedRef.current = true; // Trava imediatamente
       
       console.log("Processando fim de jogo. Vencedor:", gameState.winner, "Eu sou:", userName);
       
       const amIWinner = (gameState.winner === userName);
       setStats(prev => ({
         ...prev,
         matches: prev.matches + 1,
         wins: amIWinner ? prev.wins + 1 : prev.wins,
         coins: prev.coins + (amIWinner ? 20 : 5)
       }));
    }
  }, [gameState.winner, userName]);

  // Configuração Áudio
  useEffect(() => {
    bgmRef.current.onerror = () => { bgmRef.current.src = BATTLE_MUSIC_FALLBACK; };
    sfxRef.current.onerror = () => { sfxRef.current.src = CLASH_SFX_FALLBACK; };
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.4;
    sfxRef.current.volume = 0.7;
  }, []);

  useEffect(() => {
    if ((phase === 'BATTLE' || gameState.status === 'BATTLE') && !gameState.winner) {
      bgmRef.current.play().catch(() => {});
    } else {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  }, [phase, gameState.status, gameState.winner]);

  const playClashSound = useCallback(() => {
    const sound = sfxRef.current.cloneNode();
    sound.volume = 0.6;
    sound.play().catch(() => {});
  }, []);

  const generateLetter = useCallback(() => {
    const chars = "ABXYLRUDN";
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }, []);

  const addSparks = useCallback((pos) => {
    const isSD = gameState.battleTime >= 30;
    const newSparks = Array.from({ length: isSD ? 12 : 8 }).map(() => ({
      id: Math.random(), x: 50 + (pos / 25), y: 50,
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
    if (!id) return alert("DIGITE O CÓDIGO!");
    const rId = id.toUpperCase();
    const roomRef = ref(db, `rooms/${rId}`);
    try {
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
        // Ao entrar, garantimos que winner é null localmente para evitar bugs visuais
        setGameState(prev => ({...prev, winner: null}));
        
        await update(roomRef, { 
          skinP2: selectedBey.img, 
          nameP2: userName || 'PLAYER 2', 
          statsP2: stats, 
          status: 'READY' 
        });
        setMyRole('p2'); setRoomId(rId); setMode('ONLINE'); setPhase('LOBBY');
      } else {
        alert("SALA NÃO ENCONTRADA!");
      }
    } catch (e) {
      alert("ERRO DE CONEXÃO!");
    }
  };

  useEffect(() => {
    if (mode === 'ONLINE' && roomId) {
      const roomRef = ref(db, `rooms/${roomId}`);
      return onValue(roomRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setGameState(prev => ({...prev, ...data}));
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
        playClashSound();
        
        const power = prev.battleTime >= 30 ? 45 : 25;
        const nextKey = generateLetter();

        if (mode === 'ONLINE') {
          const updates = {};
          if (myRole === 'p1') {
            updates['rpmP1'] = Math.min(400, prev.rpmP1 + power);
          } else {
            updates['rpmP2'] = Math.min(400, prev.rpmP2 + power);
          }
          updates['targetKey'] = nextKey;
          update(ref(db, `rooms/${roomId}`), updates);
          
          return {
             ...prev, 
             [myRole === 'p1' ? 'rpmP1' : 'rpmP2']: Math.min(400, (myRole === 'p1' ? prev.rpmP1 : prev.rpmP2) + power),
             targetKey: nextKey
          };
        } else {
          return { ...prev, rpmP1: Math.min(400, prev.rpmP1 + power), targetKey: nextKey };
        }
      }
      return prev;
    });
  }, [phase, gameState.status, gameState.winner, mode, myRole, roomId, generateLetter, addSparks, playClashSound]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // FÍSICA HOST
  useEffect(() => {
    if (mode === 'ONLINE' && myRole !== 'p1') return;
    if ((phase !== 'BATTLE' && gameState.status !== 'BATTLE') || gameState.winner) return;
    
    const interval = setInterval(() => {
      setGameState(prev => {
        const isSD = prev.battleTime >= 30;
        const drain = arenas[arenaType].drain * (isSD ? 2.2 : 1.0);
        let cpuBoost = (mode === 'CPU' && Math.random() > (isSD ? 0.90 : 0.94)) ? (isSD ? 35 : 20) : 0;
        
        const newRpmP1 = Math.max(0, prev.rpmP1 - 0.75 * drain);
        const rpmP2ForPhysics = mode === 'ONLINE' ? prev.rpmP2 : Math.max(0, prev.rpmP2 + cpuBoost - 0.75 * drain);

        const diff = newRpmP1 - rpmP2ForPhysics;
        let newPos = prev.clashPos + (diff * (isSD ? 0.28 : 0.15));
        let newWinner = null;

        if (newPos > 700 || newPos < -700) {
          setIsKOFlash(true); setTimeout(() => setIsKOFlash(false), 200);
          newWinner = newPos > 700 ? prev.nameP1 : prev.nameP2;
        }

        if (mode === 'ONLINE') {
            update(ref(db, `rooms/${roomId}`), {
                battleTime: prev.battleTime + 0.1,
                clashPos: newPos,
                rpmP1: newRpmP1,
                winner: newWinner
            });
        }

        return {
          ...prev,
          battleTime: prev.battleTime + 0.1,
          clashPos: newPos,
          rpmP1: newRpmP1,
          rpmP2: rpmP2ForPhysics,
          winner: newWinner
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [mode, myRole, phase, gameState.status, gameState.winner, roomId, arenaType]);

  // FÍSICA GUEST
  useEffect(() => {
    if (mode !== 'ONLINE' || myRole !== 'p2') return;
    if ((phase !== 'BATTLE' && gameState.status !== 'BATTLE') || gameState.winner) return;

    const interval = setInterval(() => {
        setGameState(prev => {
            const isSD = prev.battleTime >= 30;
            const drain = arenas[arenaType].drain * (isSD ? 2.2 : 1.0);
            const newRpmP2 = Math.max(0, prev.rpmP2 - 0.75 * drain);
            update(ref(db, `rooms/${roomId}`), { rpmP2: newRpmP2 });
            return { ...prev, rpmP2: newRpmP2 };
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

  const myRank = getRank(stats.wins);
  const myBadges = checkAchievements(stats);

  return (
    <div className={`game-root ${getShakeClass()}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .game-root { position: fixed; inset: 0; background: #000; color: #fff; font-family: 'Press Start 2P', cursive; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
        .shake-soft { animation: shakeEffect 0.12s infinite; }
        .shake-hard { animation: shakeEffect 0.08s infinite; background: #2a0000 !important; }
        .shake-sd { animation: shakeEffect 0.1s infinite; background: #1a0000 !important; }
        @keyframes shakeEffect { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-2px, -1px); } 100% { transform: translate(1px, 1px); } }
        .ko-flash { position: fixed; inset: 0; background: #fff; z-index: 999; pointer-events: none; animation: flashAnim 0.2s forwards; }
        @keyframes flashAnim { from { opacity: 1; } to { opacity: 0; } }
        .hud-battle { position: absolute; top: 35px; display: flex; align-items: center; gap: 20px; z-index: 10; width: 100%; justify-content: center; }
        .timer { font-size: 12px; padding: 8px; border: 2px solid #fff; background: #000; min-width: 50px; text-align: center; }
        .bar-outer { width: 200px; height: 14px; background: #111; border: 3px solid #fff; transform: skewX(-15deg); overflow: hidden; }
        .bar-fill { height: 100%; transition: width 0.1s linear; }
        .stadium { width: 95vw; height: 40vh; border-top: 6px solid #333; border-bottom: 6px solid #333; position: relative; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle, #222 0%, #000 100%); }
        .bey { width: 80px; height: 80px; position: absolute; z-index: 5; transition: left 0.1s linear, right 0.1s linear; display: flex; align-items: center; justify-content: center; }
        .bey img { width: 100%; height: 100%; object-fit: contain; }
        .bey-fallback { width: 100%; height: 100%; border-radius: 50%; border: 4px solid #fff; box-shadow: 0 0 15px currentColor; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; background: #000; }
        .qte-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: #fff; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border: 4px solid #f1c40f; font-size: 30px; z-index: 100; box-shadow: 0 0 20px #f1c40f; border-radius: 10px; }
        .panel { border: 4px solid #fff; padding: 20px; background: #111; text-align: center; box-shadow: 6px 6px 0 #c0392b; max-width: 90vw; }
        .btn { padding: 10px 20px; margin: 5px; background: #000; border: 3px solid #fff; color: #fff; cursor: pointer; font-family: 'Press Start 2P'; font-size: 10px; }
        .rank-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 8px; margin-top: 5px; color: #000; font-weight: bold; }
        .achievements { margin-top: 5px; font-size: 14px; letter-spacing: 2px; }
      `}</style>

      {isKOFlash && <div className="ko-flash" />}

      {(phase === 'BATTLE' || gameState.status === 'BATTLE') && !gameState.winner && (
        <div className="hud-battle">
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '8px', color: '#f1c40f', marginBottom: '4px'}}>{gameState.nameP1}</div>
            <div className="bar-outer"><div className="bar-fill" style={{ width: `${(gameState.rpmP1/300)*100}%`, background: selectedBey.color }} /></div>
          </div>
          <div className="timer" style={{ borderColor: gameState.battleTime >= 30 ? '#ff0000' : '#fff', color: gameState.battleTime >= 30 ? '#ff0000' : '#fff' }}>
            {Math.floor(gameState.battleTime)}s
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '8px', color: '#ff4b2b', marginBottom: '4px'}}>{gameState.nameP2}</div>
            <div className="bar-outer" style={{ transform: 'skewX(15deg)' }}><div className="bar-fill" style={{ width: `${(gameState.rpmP2/300)*100}%`, background: '#ff4b2b' }} /></div>
          </div>
        </div>
      )}

      {(phase === 'BATTLE' || gameState.status === 'BATTLE') && (
        <div className={`stadium ${gameState.battleTime >= 30 ? 'active-sd' : ''}`} style={{background: arenas[arenaType].bg, borderColor: arenas[arenaType].color}}>
          {gameState.battleTime >= 30 && !gameState.winner && <div style={{position: 'absolute', top: '10px', color: 'red', zIndex:20}}>SUDDEN DEATH!</div>}
          {!gameState.winner && <div className="qte-center">{gameState.targetKey}</div>}
          <div className="bey" style={{ left: `calc(50% - 80px + ${gameState.clashPos}px)`, color: selectedBey.color }}>
            <img src={mode === 'ONLINE' ? gameState.skinP1 : selectedBey.img} width="100%" alt="P1" style={{ transform: `rotate(${Date.now() * (gameState.rpmP1/10)}deg)` }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            <div className="bey-fallback" style={{display: 'none', borderColor: selectedBey.color, transform: `rotate(${Date.now() * (gameState.rpmP1/10)}deg)`}}>P1</div>
            {gameState.battleTime >= 30 && <Lightning bolColor="#00d4ff" />}
          </div>
          <div className="bey" style={{ right: `calc(50% - 80px - ${gameState.clashPos}px)`, color: '#ff4b2b' }}>
            <img src={gameState.skinP2} width="100%" alt="P2" style={{ transform: `rotate(-${Date.now() * (gameState.rpmP2/10)}deg)` }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            <div className="bey-fallback" style={{display: 'none', borderColor: '#ff4b2b', transform: `rotate(-${Date.now() * (gameState.rpmP2/10)}deg)`}}>P2</div>
            {gameState.battleTime >= 30 && <Lightning bolColor="#ff4b2b" />}
          </div>
          {sparks.map((s) => (
            <div key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: '6px', height: '6px', background: '#f1c40f', opacity: s.life, boxShadow: '2px 2px 0 #000' }} />
          ))}
        </div>
      )}

      {phase === 'TITLE' && (
        <div className="panel">
          <h1 style={{color: '#f1c40f', fontSize: '20px', marginBottom: '20px'}}>BEY-CHAMPION</h1>
          {userName && (
            <div style={{marginBottom: '20px', padding: '10px', border: '1px dashed #444'}}>
               <p style={{fontSize: '10px', color: '#888'}}>RANK ATUAL</p>
               <div className="rank-badge" style={{background: myRank.color}}>
                  {myRank.icon} {myRank.title}
               </div>
               <div className="achievements">
                  {myBadges.length > 0 ? myBadges.map(b => <span key={b} style={{margin:'0 2px'}}>{b}</span>) : <span style={{fontSize:'8px', color:'#555'}}>SEM CONQUISTAS</span>}
               </div>
               <p style={{fontSize: '8px', marginTop: '10px'}}>VITÓRIAS: {stats.wins} | PARTIDAS: {stats.matches}</p>
            </div>
          )}
          <input style={{background: '#000', border: '2px solid #fff', color: '#fff', padding: '10px', textAlign: 'center', fontFamily: "'Press Start 2P'"}} placeholder="NAME" value={userName} onChange={(e) => setUserName(e.target.value.toUpperCase())} maxLength={10} />
          <br/><br/>
          <button className="btn" onClick={() => { bgmRef.current.play().catch(() => {}); userName ? setPhase('MODE_SELECT') : alert("ENTER NAME"); }}>START</button>
          <button className="btn" onClick={() => setPhase('SHOP')}>SHOP</button>
          <button className="btn" onClick={() => setPhase('TASKS')}>TASKS</button>
        </div>
      )}

      {phase === 'TASKS' && (
        <div className="panel">
          <h2>DAILY TASKS</h2>
          <ul style={{textAlign: 'left', fontSize: '10px', listStyle: 'none', padding: 0}}>
            <li style={{marginBottom: '10px', color: stats.matches >= 1 ? '#00ff00' : '#fff'}}>
              {stats.matches >= 1 ? '[X]' : '[ ]'} JOGAR 1 PARTIDA (+50💰)
            </li>
            <li style={{marginBottom: '10px', color: stats.wins >= 3 ? '#00ff00' : '#fff'}}>
              {stats.wins >= 3 ? '[X]' : '[ ]'} VENCER 3 VEZES (+100💰)
            </li>
            <li style={{marginBottom: '10px', color: stats.coins >= 200 ? '#00ff00' : '#fff'}}>
              {stats.coins >= 200 ? '[X]' : '[ ]'} TER 200 MOEDAS (+RARE SKIN)
            </li>
          </ul>
          <button className="btn" onClick={() => setPhase('TITLE')}>BACK</button>
        </div>
      )}

      {phase === 'MODE_SELECT' && (
        <div className="panel">
          <h2>MODE</h2>
          <button className="btn" onClick={() => { setMode('CPU'); setPhase('ARENA_SELECT'); setGameState(s => ({...s, nameP1: userName, nameP2: 'CPU'})); }}>VS CPU</button>
          <button className="btn" onClick={() => setPhase('ONLINE_MENU')}>ONLINE ROOMS</button>
        </div>
      )}

      {phase === 'LOBBY' && (
        <div className="panel">
          <h2>LOBBY</h2>
          <p style={{color: '#f1c40f', fontSize: '14px'}}>CODE: {roomId}</p>
          <div style={{display: 'flex', justifyContent: 'space-around', margin: '20px 0', gap: '20px'}}>
             <div>
                <p style={{fontSize: '10px', color: '#00d4ff'}}>YOU</p>
                <div className="rank-badge" style={{background: myRank.color}}>{myRank.icon}</div>
             </div>
             {gameState.status === 'READY' && (
                <div>
                   <p style={{fontSize: '10px', color: '#ff4b2b'}}>OPPONENT</p>
                   <div style={{fontSize: '20px'}}>⚔️</div>
                </div>
             )}
          </div>
          <p style={{fontSize: '10px', margin: '20px 0'}}>
            {gameState.status === 'LOBBY' ? "WAITING FOR OPPONENT..." : "OPPONENT READY!"}
          </p>
          {myRole === 'p1' && gameState.status === 'READY' && (
            <button className="btn" onClick={() => {
              // AQUI ESTAVA O PROBLEMA: LIMPAMOS O VENCEDOR AO INICIAR
              update(ref(db, 'rooms/' + roomId), { status: 'BATTLE', winner: null, clashPos: 0, battleTime: 0, rpmP1: 50, rpmP2: 50 });
              setPhase('BATTLE');
            }}>START BATTLE</button>
          )}
          <button className="btn" onClick={() => setPhase('TITLE')}>CANCEL</button>
        </div>
      )}

      {phase === 'ONLINE_MENU' && (
        <div className="panel">
          <h2>ONLINE ROOMS</h2>
          <button className="btn" onClick={() => {
            const newId = Math.random().toString(36).substring(7).toUpperCase();
            setRoomId(newId); setMyRole('p1'); setMode('ONLINE');
            set(ref(db, 'rooms/' + newId), { 
              ...gameState, targetKey: 'A', skinP1: selectedBey.img, nameP1: userName || 'PLAYER 1', status: 'LOBBY', statsP1: stats, winner: null 
            });
            setPhase('LOBBY');
          }}>CREATE ROOM</button>
          <div style={{margin: '15px 0'}}>
            <input style={{padding: '5px', width: '100px', background: '#000', color: '#fff', border: '1px solid #fff', fontFamily: "'Press Start 2P'", fontSize: '10px'}} placeholder="CODE" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
            <button className="btn" onClick={() => joinRoom(joinCode)}>JOIN</button>
          </div>
          <button className="btn" onClick={() => setPhase('MODE_SELECT')}>BACK</button>
        </div>
      )}

      {phase === 'SHOP' && (
        <div className="panel">
          <h2>SHOP (💰{stats.coins})</h2>
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', margin: '15px 0'}}>
            {BEY_SHOP.map(b => (
              <div key={b.id} style={{border: '1px solid #444', padding: '10px'}}>
                <img src={b.img} width="40" alt={b.name} onError={(e) => e.target.style.opacity = '0.3'} />
                <p style={{fontSize: '8px'}}>${b.price}</p>
                {inventory.includes(b.id) ? 
                  <button className="btn" onClick={() => { setSelectedBey(b); setGameState(s => ({...s, skinP1: b.img})); setPhase('TITLE'); }}>SELECT</button> :
                  <button className="btn" onClick={() => stats.coins >= b.price && (setStats(s => ({...s, coins: s.coins - b.price})) || setInventory(i => [...i, b.id]))}>BUY</button>
                }
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
            <button key={id} className="btn" style={{borderColor: arenas[id].color}} onClick={() => { setArenaType(id); setPhase('BATTLE'); setGameState(s => ({...s, status: 'BATTLE', battleTime: 0, clashPos: 0, winner: null})); }}>{arenas[id].name}</button>
          ))}
        </div>
      )}

      {gameState.winner && (
        <div className="panel" style={{position: 'absolute', zIndex: 1000}}>
          <h2 style={{color: '#f1c40f'}}>{gameState.winner} WINS!</h2>
          <p style={{fontSize: '10px', margin: '10px 0'}}>
             {gameState.winner === userName ? "+20 COINS" : "+5 COINS"}
          </p>
          <button className="btn" onClick={() => window.location.reload()}>FINISH</button>
        </div>
      )}
    </div>
  );
};

export default BeybladeChampionship;