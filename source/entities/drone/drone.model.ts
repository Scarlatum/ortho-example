import { phyQueue } from "~/main";
import { EntityType } from "~/workers/phy.shared";

import { DroneWTO } from "./drone.shared";

import BasicScene from "~/scenes/cyber.scene";

export function drone(res: ArrayBuffer, scene: BasicScene) {

  phyQueue.add({
    type: EntityType.Drone,
    payload: {
      width: 1, height: 2,
      pos: scene.actor.camera.position,
      vec: scene.actor.camera.moveVector,
    } satisfies DroneWTO
  });

}