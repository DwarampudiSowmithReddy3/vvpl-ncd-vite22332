// Global button click handler to make buttons stay yellow after clicking
export const initializeButtonClickHandler = () => {
  // Function to handle button clicks
  const handleButtonClick = (event) => {
    const button = event.target.closest('button, .btn, .button, input[type="button"], input[type="submit"], input[type="reset"]');
    
    if (button) {
      // Don't apply to logout, close, or menu toggle buttons (exceptions)
      if (button.classList.contains('sidebar-logout') || 
          button.classList.contains('close-button') || 
          button.classList.contains('sidebar-close') ||
          button.classList.contains('menu-toggle')) {
        return;
      }
      
      // Remove clicked class from ALL buttons globally (except sidebar items)
      const allButtons = document.querySelectorAll('button.clicked, .btn.clicked, .button.clicked');
      allButtons.forEach(btn => {
        if (!btn.classList.contains('sidebar-item')) {
          btn.classList.remove('clicked');
        }
      });
      
      // Add clicked class to make current button stay yellow
      button.classList.add('clicked');
    }
  };

  // Function to handle link clicks (for sidebar navigation)
  const handleLinkClick = (event) => {
    const link = event.target.closest('a.sidebar-item');
    if (link) {
      // Remove clicked class from all sidebar items
      const allSidebarItems = document.querySelectorAll('.sidebar-item');
      allSidebarItems.forEach(item => {
        item.classList.remove('clicked');
      });
      
      // Add clicked class to the current item (will turn blue via CSS)
      link.classList.add('clicked');
    }
  };

  // Function to handle select changes (for format selector)
  const handleSelectChange = (event) => {
    if (event.target.classList.contains('format-selector')) {
      // Find the download button in the same container and make it active
      const container = event.target.closest('.header-actions');
      if (container) {
        const downloadButton = container.querySelector('.download-button');
        if (downloadButton) {
          downloadButton.classList.add('clicked');
        }
      }
    }
  };

  // Add event listeners
  document.addEventListener('click', handleButtonClick);
  document.addEventListener('click', handleLinkClick);
  document.addEventListener('change', handleSelectChange);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('click', handleButtonClick);
    document.removeEventListener('click', handleLinkClick);
    document.removeEventListener('change', handleSelectChange);
  };
};

// Function to manually set a button as active/clicked
export const setButtonActive = (buttonElement) => {
  if (buttonElement) {
    buttonElement.classList.add('clicked');
  }
};

// Function to remove active state from a button
export const setButtonInactive = (buttonElement) => {
  if (buttonElement) {
    buttonElement.classList.remove('clicked');
  }
};

// Function to remove active state from all buttons
export const clearAllActiveButtons = () => {
  const activeButtons = document.querySelectorAll('button.clicked, .btn.clicked, .button.clicked');
  activeButtons.forEach(button => {
    button.classList.remove('clicked');
  });
};