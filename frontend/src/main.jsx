import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // mee project lo unte

// Disable all console messages in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
}

// Disable alert() messages
window.alert = () => {};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
