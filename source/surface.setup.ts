declare const surface: HTMLCanvasElement;

surface.height = (surface.width = innerWidth) / (21 / 9);

// surface.height = innerHeight;
// surface.width = innerWidth;

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
  
  surface.height = (surface.width = innerWidth) / (21 / 9);

  // surface.height = innerHeight;
  // surface.width = innerWidth;

});

addEventListener("keydown", event => {
  if (event.key === "\\" ) {

    var link = document.createElement('a');

    link.href = (context.canvas as HTMLCanvasElement).toDataURL();
    link.download = `${ Date.now() }.ortho.png`
    link.click();

  }
})