import VanillaTilt from 'vanilla-tilt';

export function initTiltEffect(selectors = [], options = {}) {
  const defaultOptions = {
    max: 35,
    speed: 300,
    scale: 1.1,
    "data-tilt-max": 20,
    transition: true
  };

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length) {
      VanillaTilt.init(elements, { ...defaultOptions, ...options });
    }
  });
}
