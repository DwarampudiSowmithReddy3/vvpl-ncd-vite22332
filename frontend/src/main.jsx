// ABSOLUTE SECURITY: Stop all console output in production
if (!import.meta.env.DEV) {
  const blackHole = () => {};
  const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'group', 'groupCollapsed'];
  methods.forEach(method => {
    console[method] = blackHole;
  });
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {
  initAbsoluteDevToolsBlock,
  disableAllConsole,
  initNetworkEncryption,
  protectStorage,
  protectDOM,
} from "./utils/absoluteSecurityLock";

// ============================================================================
// INITIALIZE ABSOLUTE SECURITY (Production Only)
// ============================================================================

if (import.meta.env.PROD || window.__STRICT_SECURITY__) {
  // 1. Block DevTools completely
  initAbsoluteDevToolsBlock();

  // 2. Disable all console methods
  disableAllConsole();

  // 3. Encrypt all network traffic
  initNetworkEncryption();

  // 4. Protect storage
  protectStorage();

  // 5. Protect DOM
  protectDOM();

  // 6. Disable right-click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 7. Disable keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Disable common developer shortcuts
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.metaKey && e.altKey && e.key === 'I') ||
      (e.metaKey && e.altKey && e.key === 'C') ||
      (e.metaKey && e.altKey && e.key === 'J')
    ) {
      e.preventDefault();
      return false;
    }
  });

  // 8. Disable alert/confirm/prompt
  window.alert = () => {};
  window.confirm = () => false;
  window.prompt = () => null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
