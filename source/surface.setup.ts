declare const surface: HTMLCanvasElement;

const scale = innerWidth / innerWidth;
// const aspect = 21 / 9;
const aspect = innerWidth / innerHeight;

surface.height = (surface.width = innerWidth * scale) / aspect;

addEventListener("click", () => {
  surface.addEventListener("mouseenter", () => {
    try {
      surface.requestPointerLock();
    } catch(e) {
      console.warn(e)
    }
  });
}, { once: true });

addEventListener("resize", () => {
  surface.height = (surface.width = innerWidth * scale) / aspect;
});

addEventListener("keydown", event => {
  if (event.key === "\\" ) {

    var link = document.createElement('a');

    link.href = (context.canvas as HTMLCanvasElement).toDataURL();
    link.download = `${ Date.now() }.ortho.png`
    link.click();

  }
})
