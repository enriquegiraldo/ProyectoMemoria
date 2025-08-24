import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import MemorialPage from './pages/MemorialPage';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<MemorialPage />} />
            <Route path="/page/:pageId" element={<MemorialPage />} />
            {/* Agregar más rutas según sea necesario */}
          </Routes>
        </div>
      </Router>
    </Provider>
  );
};

export default App;
