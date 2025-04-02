import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; 
import App from "./App";
import "./index.css";

// ✅ Import Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// ✅ Ensure the root element exists before rendering
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("❌ Root element with id 'root' not found in index.html");
} else {
  // ✅ Create React root & render App inside BrowserRouter
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}





