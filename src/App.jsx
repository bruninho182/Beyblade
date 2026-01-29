import React from 'react';
import Arena from './components/Arena'; // Importando o componente que você criou
import './App.css';

function App() {
  return (
    <div className="App" style={{ backgroundColor: '#282c34', minHeight: '100vh' }}>
      <header className="App-header">
        <h1 style={{ textAlign: 'center', color: 'white', paddingTop: '20px' }}>
          Beyblade Online
        </h1>
      </header>
      
      <main style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        {/* Aqui é onde o jogo realmente aparece */}
        <Arena />
      </main>
    </div>
  );
}

export default App;