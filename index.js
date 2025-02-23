import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// ✅ Ensure the root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("❌ Root element with id 'root' not found in index.html");
}

// ✅ Create React root
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

