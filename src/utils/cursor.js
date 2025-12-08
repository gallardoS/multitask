const largeCursor = "url('/dot_large.svg') 16 16, auto";
const smallCursor = "url('/dot_small.svg') 16 16, auto";
const largePointer = "url('/dot_large.svg') 16 16, pointer";
const smallPointer = "url('/dot_small.svg') 16 16, pointer";

function setCursor(size = 'large') {
  const cursor = size === 'small' ? smallCursor : largeCursor;
  const pointer = size === 'small' ? smallPointer : largePointer;

  document.body.style.cursor = cursor;

  document.querySelectorAll('*').forEach(el => {
    const computedCursor = getComputedStyle(el).cursor;

    if (computedCursor === 'pointer') {
      el.style.cursor = pointer;
    } else if (computedCursor.startsWith('url(')) {
      el.style.cursor = cursor;
    }
  });
}

export function initCursorHandlers() {
  document.addEventListener('mousedown', () => setCursor('small'));
  document.addEventListener('mouseup', () => setCursor('large'));
}
