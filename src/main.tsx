
// Precisa ser o primeiro import: envolve o fetch antes que o cliente do
// Supabase seja criado e guarde a referência original.
import './utils/rede';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeCacheVersioning } from "./utils/cacheVersioning";

// PR-C: Inicializar cache versioning antes do app
initializeCacheVersioning();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
