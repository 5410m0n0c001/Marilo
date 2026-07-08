/**
 * Premium Multi-Viewport Showcase Component Script
 * Features:
 * - Independent Object-Oriented class instances for multiple viewports
 * - requestAnimationFrame for smooth 60 FPS scrolling
 * - Lazy-loading and preloading (only 2 images in DOM per visor)
 * - Apple-inspired 3D cylinder rotating transition
 * - Hover / Touch pause behavior per frame
 */

class ShowcaseVisor {
  constructor(viewportId, frameId, images) {
    this.viewport = document.getElementById(viewportId);
    this.frame = document.getElementById(frameId);
    this.images = images;
    
    if (!this.viewport || !this.frame) return;

    this.activeIndex = 0;
    this.isPaused = false;
    this.isTransitioning = false;
    this.currentY = 0;
    this.maxScrollY = 0;
    this.lastTime = 0;

    // Create double-buffer container layers
    this.activeContainer = document.createElement("div");
    this.activeContainer.className = "screenshot-container active";
    this.activeImg = document.createElement("img");
    this.activeImg.className = "screenshot-img";
    this.activeContainer.appendChild(this.activeImg);
    this.viewport.appendChild(this.activeContainer);

    this.incomingContainer = document.createElement("div");
    this.incomingContainer.className = "screenshot-container incoming";
    this.incomingImg = document.createElement("img");
    this.incomingImg.className = "screenshot-img";
    this.incomingContainer.appendChild(this.incomingImg);
    this.viewport.appendChild(this.incomingContainer);

    // Initial load
    this.loadProject(0);

    // Event listeners
    this.frame.addEventListener("mouseenter", () => { this.isPaused = true; });
    this.frame.addEventListener("mouseleave", () => { this.isPaused = false; });
    
    this.frame.addEventListener("touchstart", () => { this.isPaused = true; }, { passive: true });
    this.frame.addEventListener("touchend", () => { this.isPaused = false; }, { passive: true });
    this.frame.addEventListener("touchcancel", () => { this.isPaused = false; }, { passive: true });

    // Recalculate heights on window resize
    window.addEventListener("resize", () => this.calculateHeights());

    // Start Loop
    requestAnimationFrame((t) => this.updateLoop(t));
  }

  loadProject(index) {
    this.activeIndex = index;
    this.activeImg.src = this.images[index];
    this.currentY = 0;
    this.activeImg.style.transform = `translateY(0)`;
    
    this.activeImg.onload = () => this.calculateHeights();
    if (this.activeImg.complete) {
      this.calculateHeights();
    }

    // Preload next image in queue
    const nextIndex = (index + 1) % this.images.length;
    this.incomingImg.src = this.images[nextIndex];
  }

  calculateHeights() {
    if (!this.activeImg || !this.viewport) return;
    const imgHeight = this.activeImg.getBoundingClientRect().height;
    const viewHeight = this.viewport.getBoundingClientRect().height;
    this.maxScrollY = Math.max(0, imgHeight - viewHeight);
  }

  updateLoop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (!this.isPaused && !this.isTransitioning && this.maxScrollY > 0) {
      this.currentY += 50 * delta; // speed in pixels per second
      
      if (this.currentY >= this.maxScrollY) {
        this.currentY = this.maxScrollY;
        this.activeImg.style.transform = `translateY(-${this.currentY}px)`;
        
        // Pause at bottom, then transition
        this.isTransitioning = true;
        setTimeout(() => {
          this.triggerTransition();
        }, 1200); // 1.2 second pause
      } else {
        this.activeImg.style.transform = `translateY(-${this.currentY}px)`;
      }
    }

    requestAnimationFrame((t) => this.updateLoop(t));
  }

  triggerTransition() {
    this.isTransitioning = true;
    this.isPaused = true;
    
    const nextIndex = (this.activeIndex + 1) % this.images.length;
    this.incomingImg.src = this.images[nextIndex];
    this.incomingImg.style.transform = "translateY(0)";

    // Force reflow/repaint
    this.incomingContainer.getBoundingClientRect();

    // Trigger CSS 3D Slot Machine Transition
    this.activeContainer.classList.remove("active");
    this.activeContainer.classList.add("outgoing");

    this.incomingContainer.classList.remove("incoming");
    this.incomingContainer.classList.add("active");

    setTimeout(() => {
      // Swap layers
      const tempContainer = this.activeContainer;
      const tempImg = this.activeImg;

      this.activeContainer = this.incomingContainer;
      this.activeImg = this.incomingImg;

      this.incomingContainer = tempContainer;
      this.incomingImg = tempImg;

      // Reset new incoming container
      this.incomingContainer.className = "screenshot-container incoming";
      this.incomingImg.style.transform = "translateY(0)";

      this.activeIndex = nextIndex;
      this.calculateHeights();

      this.currentY = 0;
      this.isTransitioning = false;
      this.isPaused = false;
    }, 1800); // transition duration matching CSS
  }
}

// Initialize Visors once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Visor 1: Branding & Identidad
  new ShowcaseVisor(
    "showcase-viewport-1",
    "device-frame-1",
    [
      "assets/images/identidad grafica.png",
      "assets/images/55680def-d305-4a89-8bce-a351dcb7c3ac.png"
    ]
  );

  // Visor 2: Ecosistema & Interfaces
  new ShowcaseVisor(
    "showcase-viewport-2",
    "device-frame-2",
    [
      "assets/images/3096949b-3bbb-4399-9024-0cec2ac380ff.png",
      "assets/images/a28a990a-18ba-437f-981d-1087a5de8498.png"
    ]
  );

  // Visor 3: Embudos & Plataformas
  new ShowcaseVisor(
    "showcase-viewport-3",
    "device-frame-3",
    [
      "assets/images/82bd38aa-dd1c-4476-9d32-3aa8ced084c8.png",
      "assets/images/48b887dc-1874-4b9d-9bab-3c748739b2c8.png",
      "assets/images/4fb5effe-c12b-402e-ac01-b370faa9af6c.png"
    ]
  );
});
