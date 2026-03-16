// DevTools Detector - Disables DevTools in production
// This prevents users from inspecting network requests and console

export const initDevToolsDetector = () => {
  // Only in production
  if (import.meta.env.PROD) {
    // Method 1: Detect DevTools opening via console.clear
    let devToolsOpen = false;
    const threshold = 160;

    setInterval(() => {
      const start = performance.now();
      debugger; // This is slow when DevTools is open
      const end = performance.now();

      if (end - start > threshold) {
        devToolsOpen = true;
        handleDevToolsDetected();
      }
    }, 500);

    // Method 2: Detect via window size changes
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    window.addEventListener('resize', () => {
      if (window.innerWidth !== originalWidth || window.innerHeight !== originalHeight) {
        // DevTools might be open
        if (Math.abs(window.innerWidth - originalWidth) > 100 || 
            Math.abs(window.innerHeight - originalHeight) > 100) {
          handleDevToolsDetected();
        }
      }
    });

    // Method 3: Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Method 4: Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J
    document.addEventListener('keydown', (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      // Cmd+Option+I (Mac)
      if (e.metaKey && e.altKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      // Cmd+Option+C (Mac)
      if (e.metaKey && e.altKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      // Cmd+Option+J (Mac)
      if (e.metaKey && e.altKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
    });
  }
};

function handleDevToolsDetected() {
  // Option 1: Show warning
  /* Log removed */

  // Option 2: Redirect to login (more aggressive)
  // window.location.href = '/login';

  // Option 3: Disable all functionality
  // document.body.innerHTML = '<h1>Access Denied</h1>';
}

// Disable console methods in production
export const disableConsole = () => {
  if (import.meta.env.PROD) {
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.trace = () => {};
    console.table = () => {};
    console.time = () => {};
    console.timeEnd = () => {};
  }
};

// Prevent data from being logged
export const sanitizeForLogging = (data) => {
  if (import.meta.env.PROD) {
    return '[REDACTED]';
  }
  return data;
};
