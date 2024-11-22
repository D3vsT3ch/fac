import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from './components/pages/MainPage.jsx';
import AdminPanel from './components/pages/AdminPanel.jsx'; // Asegúrate de importar AdminPanel
import DocumentosPanel from './components/pages/DocumentosPanel.jsx';

import './styles/App.css';

const App = () => {
  return (
    <Routes>
      
     
      {/* Puedes agregar más rutas aquí */}
      <Route path="*" element={<div>Página no encontrada</div>} />
      <Route path="/" element={<MainPage />} />
      <Route
        path="/admin"
        element={<AdminPanel />}
      />
      <Route
        path="/documentos"
        element={<DocumentosPanel />}
      />
    </Routes>
  );
};

export default App;
