import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style/gra.css';

const korzen = document.getElementById('korzen');
if (!korzen) throw new Error('brak elementu #korzen w index.html');

createRoot(korzen).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
