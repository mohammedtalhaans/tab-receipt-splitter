import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './styles/globals.css';
import App from './App.tsx';
import './styles/experience.css';
const container = document.getElementById('root');
if (!container) throw new Error('The app root is missing.');
createRoot(container).render(<StrictMode>
  <App />
</StrictMode>);
