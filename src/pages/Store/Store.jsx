import React from 'react';
import "./Store.css";
import { Link } from 'react-router';

const Store = ({ onBack }) => {
  const BEY_SHOP = [
    { id: "p1", name: "PEGASUS", color: "#00d4ff", price: 0, rarity: "COMMON", img: "beyblade.png", type: "ATTACK", power: 1.3, def: 0.8, stamina: 1.0 },
    { id: "p2", name: "PHANTOM", color: "#12df34", price: 100, rarity: "COMMON", img: "beyblade2.png", type: "STAMINA", power: 0.8, def: 1.0, stamina: 1.4 },
    { id: "p4", name: "GALAXY", color: "#90cdd8", price: 150, rarity: "RARE", img: "beyblade4.png", type: "DEFENSE", power: 1.0, def: 1.5, stamina: 0.8 },
    { id: "p6", name: "NEMESIS", color: "#ffffff", price: 150, rarity: "RARE", img: "beyblade6.png", type: "DEFENSE", power: 1.1, def: 1.4, stamina: 0.9 },
    { id: "p11", name: "QUETZAL", color: "#20d2ff", price: 200, rarity: "RARE", img: "beyblade11.png", type: "STAMINA", power: 0.8, def: 1.2, stamina: 1.4 },
    { id: "p10", name: "MAGMA", color: "#796b44", price: 670, rarity: "RARE", img: "beyblade10.png", type: "ATTACK", power: 1.4, def: 0.9, stamina: 1.1 },
    { id: "p5", name: "BLIZZARD", color: "#f10f0f", price: 750, rarity: "RARE", img: "beyblade5.png", type: "STAMINA", power: 0.9, def: 1.1, stamina: 1.3 },
    { id: "p7", name: "BLITZ", color: "#ffbb00", price: 800, rarity: "RARE", img: "beyblade7.png", type: "ATTACK", power: 1.6, def: 0.6, stamina: 0.8 },
    { id: "p8", name: "SOLAR", color: "#f1ed0f", price: 850, rarity: "RARE", img: "beyblade8.png", type: "STAMINA", power: 1.0, def: 1.0, stamina: 1.5 },
    { id: "p9", name: "DARK HYDRA", color: "#000000", rarity: "RARE", img: "beyblade9.png", type: "DEFENSE", power: 1.2, def: 1.6, stamina: 0.7 },
    { id: "p12", name: "VENOM", color: "#5406e6", price: 950, rarity: "RARE", img: "beyblade12.png", type: "ATTACK", power: 1.7, def: 0.5, stamina: 0.8 },
    { id: "p3", name: "DRAGON", color: "#ffffff", price: 1000, rarity: "RARE", img: "beyblade3.png", type: "ATTACK", power: 1.5, def: 0.7, stamina: 0.9 },
    { id: "p13", name: "GOLD DRAGOON", color: "#ffd700", price: 9999, rarity: "LEGENDARY", img: "beybladeGOLD.png", type: "BALANCE", power: 1.5, def: 1.5, stamina: 1.5 },
  ];

  return (
    <div className="storeContainer">
      <header className="storeHeader">
        <h1 className="storeTitle">BEY-CHAMPION SHOP</h1>
        <Link to={"/"}><button className="backBtn">VOLTAR</button></Link>
      </header>

      <div className="storeList">
        {BEY_SHOP.map((beyblade) => (
          <div className="beybladeCard" key={beyblade.id} style={{ borderColor: beyblade.color }}>
            <span className="rarityBadge">{beyblade.rarity}</span>
            
            <div className="imageContainer">
              <div className="colorGlow" style={{ backgroundColor: beyblade.color }}></div>
              <img src={`src/assets/${beyblade.img}`} alt={beyblade.name} className="beybladeImg" />
            </div>

            <h2 className="beybladeName">{beyblade.name}</h2>
            <p className="beybladeType">{beyblade.type}</p>

            <div className="statsBox">
              <div className="statBar"><div style={{ width: `${beyblade.power * 50}%`, background: 'red' }}></div></div>
              <div className="statBar"><div style={{ width: `${beyblade.def * 50}%`, background: 'blue' }}></div></div>
              <div className="statBar"><div style={{ width: `${beyblade.stamina * 50}%`, background: 'green' }}></div></div>
            </div>

            <button className="buyBtn">
              {beyblade.price === 0 ? "GRÁTIS" : `${beyblade.price} G`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Store;