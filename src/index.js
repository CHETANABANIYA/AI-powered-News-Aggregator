import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; 
import App from "./App";
import "./index.css";

// Import Bootstrap with error handling
try {
  import("bootstrap/dist/css/bootstrap.min.css");
  import("bootstrap/dist/js/bootstrap.bundle.min.js");
} catch (error) {
  console.warn("⚠️ Bootstrap failed to load:", error);
}

// Ensure the root element exists before rendering
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element with id 'root' not found in index.html");
} else {
  // Create React root & render App inside a single BrowserRouter
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}





