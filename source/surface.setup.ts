declare const surface: HTMLCanvasElement;

surface.width = innerWidth;
surface.height = innerHeight;

window.addEventListener("click", () => {
  surface.addEventListener("mouseenter", () => {
    try {
      surface.requestPointerLock();
      surface.setPointerCapture(0);
    } catch(e) {
      console.warn(e)
    }
  });
}, { once: true });

window.addEventListener("resize", () => {
  surface.width = innerWidth;
  surface.height = innerHeight;
});