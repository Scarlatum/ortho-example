
import "./surface.setup";

import { Renderer } from "ortho"
import BaseScene from "./scenes/cyber/cyber.scene"
import { EntityType } from "./workers/phy.worker";

import phyWorker from "./workers/phy.worker.ts?worker";

declare const surface: HTMLCanvasElement;

export const phy = new phyWorker();
export const phyQueue = new Set<{ type: EntityType; payload: unknown; buffer?: ArrayBufferLike }>();

const workersStatus = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));

const [ _adapter, device, context ] = await Renderer.getSetup(surface);

const renderer = new Renderer(device, context);
const scene = new BaseScene(renderer);

await scene.setupScene();

renderer.addScene(scene);
renderer.render(0);

const signal = () => {

  phy.postMessage(workersStatus);

  if ( workersStatus.every(x => x) ) {
    phy.postMessage(phyQueue);
  }

  else requestAnimationFrame(signal);

}

requestAnimationFrame(signal);

export function createPhyBuffer<P>(type: EntityType, size: number = 0, payload?: P) {

  const buffer = new SharedArrayBuffer(size);

  phyQueue.add({ type, buffer, payload });

  return new Float32Array(buffer);

}