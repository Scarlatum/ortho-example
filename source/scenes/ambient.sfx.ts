import { vec3 } from "gl-matrix";
import { createReverb } from "ortho/source/audio/fx/reverb.audio";
import { SceneInterface } from "ortho/source/interfaces/scene.interface";

export const warpRange = 1600;

export function ambient(audioData: ArrayBuffer, scene: SceneInterface) {

  context.canvas.addEventListener("click", async () => {

    let pan = 0;

    const auctx = globalThis.auctx ??= new AudioContext({
      latencyHint: "interactive",
      sampleRate: 19000
    });

    const gainNode = new GainNode(auctx, { gain: 1.0, channelCount: 2 });
    const stereoNode = new StereoPannerNode(auctx);

    const source = auctx.createBufferSource();
    const data = await auctx.decodeAudioData(audioData);

    const convolver = createReverb(auctx, 1);

    source.buffer = data;
    source.loop = true;
    source
      .connect(gainNode)
      .connect(convolver)
      .connect(stereoNode)
      .connect(auctx.destination)
      ;

    source.start();

    let prevNorm = [0,0,0] as vec3;

    scene.onpass.add(() => {

      const norm = vec3.normalize(
        [ 0, 0, 0 ], 
        vec3.sub([ 0, 0, 0 ], 
          scene.camera.target, 
          scene.camera.position
      ));

      let d = vec3.distance(prevNorm, norm);

      pan -= (pan - norm[ 2 ]) * 0.05;
        
      prevNorm = [ ...norm ] as vec3; 

      gainNode.gain.value   = 2.0;
      stereoNode.pan.value  = Math.max(-0.9, Math.min(0.9, pan));

    });

  }, { once: true });

}
