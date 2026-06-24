import {
  StrictMode
} from 'react';

import {
  createRoot
} from 'react-dom/client';

import {
  BrowserRouter
} from 'react-router-dom';

import App from './App.jsx';

import {
  AuthProvider
} from './context/AuthContext.jsx';

import './styles.css';
import './emergency-network.css';
import './digital-twin.css';
import './posture-analyzer.css';
import './environmental-monitor.css';
import './next-gen-features.css';

const rootElement =
  document.getElementById(
    'root'
  );

if (!rootElement) {
  throw new Error(
    'The root element was not found.'
  );
}

createRoot(
  rootElement
).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);