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

    const convolver = createReverb(auctx, 10);

    source.buffer = data;
    source.loop = true;
    source
      .connect(convolver)
      .connect(gainNode)
      .connect(stereoNode)
      .connect(auctx.destination)
      ;

    source.start();

    scene.onpass.add(() => {

      const norm = vec3.normalize(
        [ 0, 0, 0 ], 
        vec3.sub([ 0, 0, 0 ], 
          scene.actor.camera.target, 
          scene.actor.camera.position
      ));

      // pan -= (pan - norm[ 2 ]) * 0.025;

      // gainNode.gain.value   = 3.0;
      // stereoNode.pan.value  = Math.max(-0.5, Math.min(0.5, pan));

    });

  }, { once: true });

}
