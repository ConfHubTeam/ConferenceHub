/**
 * iOS Safari specific utilities for handling zoom and touch issues
 */

// Detect if the device is iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Detect if the browser is Safari
export const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// Detect iOS Safari specifically
export const isIOSSafari = () => {
  return isIOS() && isSafari();
};

/**
 * Prevent iOS Safari from auto-zooming on input focus
 * by temporarily increasing font size
 */
export const preventIOSZoomOnInputFocus = () => {
  if (!isIOSSafari()) return;

  const inputs = document.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    const originalFontSize = window.getComputedStyle(input).fontSize;
    
    input.addEventListener('focus', () => {
      input.style.fontSize = '16px';
    });
    
    input.addEventListener('blur', () => {
      input.style.fontSize = originalFontSize;
    });
  });
};

/**
 * Handle iOS viewport height issues with keyboard
 */
export const handleIOSViewportHeight = () => {
  if (!isIOS()) return;

  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Set initial viewport height
  setViewportHeight();

  // Update on resize (keyboard show/hide)
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 500); // Delay for orientation change
  });
};

/**
 * Disable iOS Safari elastic scrolling (bounce effect) on specific elements
 */
export const disableIOSElasticScrolling = (selector = 'body') => {
  if (!isIOSSafari()) return;

  const elements = document.querySelectorAll(selector);
  
  elements.forEach(element => {
    element.style.webkitOverflowScrolling = 'auto';
    element.style.overscrollBehavior = 'none';
  });
};

/**
 * Fix iOS Safari 100vh issue by using CSS custom properties
 */
export const fixIOSViewportUnits = () => {
  if (!isIOS()) return;

  // Add CSS custom properties for real viewport units
  const css = `
    :root {
      --vh: ${window.innerHeight * 0.01}px;
      --vw: ${window.innerWidth * 0.01}px;
    }
    
    .full-height-ios {
      height: calc(var(--vh, 1vh) * 100);
    }
    
    .full-width-ios {
      width: calc(var(--vw, 1vw) * 100);
    }
  `;

  // Create and inject the style element
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Update on resize
  const updateViewportUnits = () => {
    const vh = window.innerHeight * 0.01;
    const vw = window.innerWidth * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--vw', `${vw}px`);
  };

  window.addEventListener('resize', updateViewportUnits);
  window.addEventListener('orientationchange', () => {
    setTimeout(updateViewportUnits, 500);
  });
};

/**
 * Initialize all iOS Safari fixes
 */
export const initIOSSafariFixes = () => {
  if (!isIOSSafari()) return;

  // Fix for iOS Safari 100vh issue (viewport height)
  const setVhProperty = () => {
    // Set CSS variable for full viewport height
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Set initially and on resize
  setVhProperty();
  window.addEventListener('resize', setVhProperty);
  
  // Prevent scrolling on iOS Safari when in mobile map view
  const lockBodyScrollForMap = () => {
    const isMobileMapView = document.querySelector('.fixed.inset-0.z-\\[70\\]');
    if (isMobileMapView) {
      // Lock the body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Unlock the body
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  };

  // Fix for iOS Safari position:fixed elements disappearing after scrolling
  const fixFixedElements = () => {
    const fixedElements = document.querySelectorAll('.fixed.top-0, .fixed.top-\\[73px\\]');
    fixedElements.forEach(element => {
      // Force a repaint to prevent iOS Safari from hiding fixed elements
      element.style.transform = 'translateZ(0)';
      element.style.webkitTransform = 'translateZ(0)';
    });
  };

  // Apply these fixes on scroll
  document.addEventListener('scroll', fixFixedElements, { passive: true });
  
  // Monitor DOM changes to reapply fixes when map view is toggled
  const observer = new MutationObserver(() => {
    lockBodyScrollForMap();
    fixFixedElements();
  });
  
  // Observe the body for changes that might indicate map view toggle
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Make sure we clean up
  return () => {
    window.removeEventListener('resize', setVhProperty);
    document.removeEventListener('scroll', fixFixedElements);
    observer.disconnect();
  };
};

/**
 * Force hide iOS Safari address bar
 */
export const hideIOSSafariAddressBar = () => {
  if (!isIOSSafari()) return;

  setTimeout(() => {
    window.scrollTo(0, 1);
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }, 500);
};
