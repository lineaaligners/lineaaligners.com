import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/jetbrains-mono';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
