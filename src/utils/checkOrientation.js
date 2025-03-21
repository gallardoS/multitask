export class CheckOrientation {
  constructor({
    selector = '#rotate-warning',
    mobileOnly = true,
    onLock = () => {},
    onUnlock = () => {}
  } = {}) {
    this.el = document.querySelector(selector);
    this.mobileOnly = mobileOnly;
    this.onLock = onLock;
    this.onUnlock = onUnlock;
    this.handleResize = this.handleResize.bind(this);

    this.init();
  }

  init() {
    this.updateVisibility();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);
    window.addEventListener('load', this.handleResize);
  }

  handleResize() {
    this.updateVisibility();
  }

  updateVisibility() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const shouldShow = isPortrait && (!this.mobileOnly || isMobile);

    if (this.el) {
      this.el.classList.toggle('visible', shouldShow);
    }

    if (shouldShow) {
      this.onLock();
    } else {
      this.onUnlock();
    }
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
    window.removeEventListener('load', this.handleResize);
  }
}
