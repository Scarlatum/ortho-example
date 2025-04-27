import "./assets/css/base.css";

import { Renderer, Scene } from "ortho"
import { EntityType, PhyQueueElement } from "./workers/phy.shared"

import BaseScene from "./scenes/cyber.scene"

import "./surface.setup";

declare const surface: HTMLCanvasElement;

const [ device, adapter, context ] = await Renderer.getSetup(surface);

Scene.LIGHT_PASS = false;
// Scene.SHADOW_PASS = false;

const renderer = new Renderer(device, context);
const scene = new BaseScene(renderer);

const phy = new Worker(new URL("./workers/phy.worker.ts", import.meta.url), { type: "module" });
const phyQueue = new Set<PhyQueueElement>();

phy.addEventListener("message", async event => {

  switch (event.data.spec) {
    case "preparations":
    
      scene.hitpos = event.data.payload;

			await scene.setupScene();

			renderer.addScene(scene).render();

      phy.postMessage(phyQueue);

      break;
    case "ready":

      phy.postMessage({ spec: "preparations", payload: {
        position: scene.actor.camera.position,
        direction: scene.actor.camera.direction,
      }});

      break;
  }

});

function createPhyBuffer<P>(type: EntityType, size: number = 0, payload?: P) {

  const buffer = new SharedArrayBuffer(size);

  phyQueue.add({ type, buffer, payload });

  return new Float32Array(buffer);

}

export { phy, phyQueue, createPhyBuffer };
