import React from 'react';

const BeyPortal = ({ isOpen, onClose, beys }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>BEYBLADE ARCHIVES</h2>
          <button className="close-btn" onClick={onClose}>X</button>
        </div>
        
        <div className="bey-grid">
          {beys.map(bey => (
            <div key={bey.id} className="bey-card" style={{ borderColor: bey.color }}>
              <div className="bey-icon" style={{ backgroundColor: bey.color }}></div>
              <h4>{bey.name}</h4>
              <span className="rarity-tag">{bey.rarity}</span>
              
              <div className="stat-row">
                <span>ATK</span>
                <div className="bar"><div className="fill" style={{ width: `${bey.atk}%`, backgroundColor: '#e74c3c' }}></div></div>
              </div>
              <div className="stat-row">
                <span>DEF</span>
                <div className="bar"><div className="fill" style={{ width: `${bey.def}%`, backgroundColor: '#3498db' }}></div></div>
              </div>
              <div className="stat-row">
                <span>STA</span>
                <div className="bar"><div className="fill" style={{ width: `${bey.sta}%`, backgroundColor: '#2ecc71' }}></div></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.9);
          display: flex; justify-content: center; align-items: center;
          z-index: 2000;
        }
        .modal-content {
          background: #111;
          border: 4px solid #f1c40f;
          width: 85%;
          max-width: 900px;
          max-height: 85vh;
          padding: 30px;
          overflow-y: auto;
          font-family: 'Press Start 2P', cursive;
        }
        .modal-header {
          display: flex; justify-content: space-between;
          border-bottom: 2px solid #333;
          margin-bottom: 25px;
          padding-bottom: 15px;
        }
        .close-btn {
          background: #e74c3c;
          border: none;
          color: white;
          padding: 10px 15px;
          cursor: pointer;
          font-family: 'Press Start 2P';
        }
        .bey-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 25px;
        }
        .bey-card {
          background: #000;
          border: 2px solid #333;
          padding: 20px;
          text-align: center;
          transition: 0.3s;
        }
        .bey-card:hover { transform: translateY(-5px); border-color: #f1c40f; }
        .bey-icon {
          width: 80px; height: 80px;
          border-radius: 50%;
          margin: 0 auto 15px;
          border: 4px solid #fff;
          box-shadow: 0 0 15px rgba(255,255,255,0.2);
        }
        .rarity-tag { font-size: 8px; color: #888; display: block; margin-bottom: 15px; }
        .stat-row { font-size: 9px; margin-bottom: 8px; text-align: left; color: #eee; }
        .bar { background: #222; height: 8px; width: 100%; margin-top: 4px; border-radius: 4px; overflow: hidden; }
        .fill { height: 100%; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default BeyPortal;