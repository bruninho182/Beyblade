import React, { useState, useEffect } from "react"; // Adicionado hooks para o Ranking
import Arena from "./components/Arena";
import "./App.css";
import { Link } from "react-router"; 
import BeyPortal from "./components/BeyPortal";

// Imports do Firebase para o Ranking funcionar
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, query, orderByChild, limitToLast } from "firebase/database";

// --- CONFIGURAÇÃO FIREBASE ---
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

function App() {
  const [leaderboard, setLeaderboard] = useState([]); // Estado para os dados do banco

  // --- BUSCA DE RANKING NO FIREBASE ---
  useEffect(() => {
    const rankRef = query(ref(db, 'leaderboard'), orderByChild('wins'), limitToLast(10));
    const unsubscribe = onValue(rankRef, (snapshot) => {
      const data = [];
      snapshot.forEach((child) => { data.push(child.val()); });
      setLeaderboard(data.reverse());
    });
    return () => unsubscribe();
  }, []);

  const isGameWindow = window.innerWidth < 1100;

  const openGameWindow = () => {
    const width = 1000;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      "/",
      "BeyChampionGame",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=no`,
    );
  };

  if (isGameWindow) {
    return <Arena />;
  }

  return (
    <div className="portal-container">
      <header className="game-header">
        <div className="logo-container">
          <h1 className="logo-text">BEY-CHAMPION</h1>
          <span className="logo-subtitle">OFFICIAL BATTLE PORTAL</span>
        </div>
        <nav className="nav-menu">
          <a href="#">NEWS</a>
          <a href="#">FORUM</a>
          <Link to={"/store"}>STORE</Link>
        </nav>
      </header>

      <div className="main-layout">
        <aside className="sidebar left">
          <div className="portal-box">
            <h3>LATEST NEWS</h3>
            <ul className="news-list">
              <li>• New Season 2026!</li>
              <li>• Gold Dragoon Buffed</li>
              <li>• Server Maintenance 2am</li>
            </ul>
          </div>

          {/* RANKING CONECTADO AO FIREBASE */}
          <div className="portal-box ranking-box">
            <h3>TOP RANKING</h3>
            <div className="ranking-list">
              {leaderboard.length === 0 ? (
                <p style={{fontSize: '8px', textAlign: 'center'}}>LOADING...</p>
              ) : (
                leaderboard.map((player, index) => (
                  <div key={index} className={`rank-item ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                    <span className="pos">{index + 1}º</span>
                    <span className="name">{player.name || "BLADER"}</span>
                    <span className="pts">{player.wins}W</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="game-wrapper">
          <div className="game-preview-container">
            <h2 className="preview-title">READY TO BATTLE?</h2>
            <button className="play-button-big" onClick={openGameWindow}>
              PLAY NOW
            </button>
          </div>
        </main>

        <aside className="sidebar right">
          <div className="portal-box">
            <h3>COMMUNITY</h3>
            <div className="online-count">
              <span className="dot"></span> 1,245 Bladers Online
            </div>
          </div>
          <div className="portal-box discord-promo">
            <p>Join the discord for exclusive skins!</p>
          </div>
        </aside>
      </div>

      <footer className="game-footer">
        <p>BEY-CHAMPION © 2026 - POWERED BY BRUNO FERREIRA</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        .portal-container {
          background-color: #1a1a1a;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Press Start 2P', cursive;
          color: white;
          overflow-x: hidden;
        }

        .game-header {
          background: #000;
          border-bottom: 4px solid #333;
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-text { color: #f1c40f; font-size: 22px; margin: 0; letter-spacing: 2px; }
        .logo-subtitle { color: #888; font-size: 8px; display: block; margin-top: 5px; }

        .nav-menu a, .nav-menu Link {
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          margin-left: 20px;
          transition: color 0.2s;
        }

        .nav-menu a:hover { color: #f1c40f; text-decoration: underline; }

        .main-layout {
          display: flex;
          flex: 1;
          padding: 40px;
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .sidebar { width: 260px; display: flex; flex-direction: column; gap: 20px; }

        .portal-box {
          background: #111;
          border: 2px solid #333;
          padding: 15px;
          box-shadow: 6px 6px 0 #000;
        }

        .portal-box h3 {
          font-size: 11px;
          color: #f1c40f;
          margin-top: 0;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 12px;
          text-align: center;
        }

        .ranking-list { display: flex; flex-direction: column; gap: 8px; }
        .rank-item { display: flex; justify-content: space-between; font-size: 8px; padding-bottom: 5px; border-bottom: 1px solid #222; }
        .rank-item.gold { color: #f1c40f; text-shadow: 0 0 5px #f1c40f; }
        .rank-item.silver { color: #bdc3c7; }
        .rank-item.bronze { color: #cd7f32; }
        .pts { color: #2ecc71; }

        .news-list { list-style: none; padding: 0; font-size: 9px; line-height: 2; color: #bbb; }
        .game-wrapper {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .game-preview-container {
          border: 8px solid #444;
          background: #000;
          width: 100%;
          height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          background-image: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('https://img.freepik.com/premium-photo/metal-texture-background_494741-1191.jpg');
          background-size: cover;
          box-shadow: 0 0 30px rgba(0,0,0,1);
        }

        .preview-title { color: #fff; margin-bottom: 30px; font-size: 16px; text-shadow: 2px 2px #000; }

        .play-button-big {
          background: #27ae60;
          color: white;
          padding: 25px 50px;
          font-family: 'Press Start 2P', cursive;
          font-size: 22px;
          border: 4px solid #2ecc71;
          cursor: pointer;
          box-shadow: 0 10px 0 #1e8449;
          transition: all 0.1s;
        }

        .play-button-big:hover { background: #2ecc71; transform: scale(1.05); }
        .play-button-big:active { transform: translateY(6px); box-shadow: 0 4px 0 #1e8449; }

        .online-count { font-size: 9px; color: #00ff00; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .dot { width: 8px; height: 8px; background: #00ff00; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #00ff00; }
        .discord-promo { font-size: 8px; text-align: center; color: #7289da; line-height: 1.4; }

        .game-footer {
          background: #000;
          padding: 20px;
          text-align: center;
          font-size: 8px;
          color: #555;
          border-top: 4px solid #333;
        }

        @media (max-width: 1250px) {
          .sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}

export default App;