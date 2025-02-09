import { World, init } from "@dimforge/rapier3d-compat";

import container from "~/scenes/cyber/entities/container/container.physics";

import { terrain } from "~/scenes/cyber/entities/terrain/terrain.physics";
import { cars } from "~/scenes/cyber/entities/car/car.physics";
import { drone } from "~/scenes/cyber/entities/drone/drone.physics";

import pillars from "~/scenes/cyber/entities/pillars/pillars.physics";

export const enum EntityType {
  Container,
  Terrain,
  Pillars,
  Cars,
  Drone,
}

await init();

const world = new World({ x: 0, y: -9.0, z: 0 });
const queue = new Set<Function>();

world.numSolverIterations = 8;

function router(type: EntityType, buffer: ArrayBufferLike, payload: any) {
  switch ( type ) {
    case EntityType.Container: {
      container(world, queue, new Float32Array(buffer))
    }; break;
    case EntityType.Cars: {
      cars(world, queue, new Float32Array(buffer), payload)
    }; break;
    case EntityType.Terrain: {
      terrain(world, payload);
    }; break;
    case EntityType.Drone: {
      drone(world, queue, payload);
    }; break;
    case EntityType.Pillars: {
      pillars(world, payload);
    }; break;
  }
}

function phyloop() {

  for ( const f of queue ) f();

  world.step();

  self.requestAnimationFrame(phyloop);

};

self.onmessage = event => {

  if ( import.meta.env.DEV ) console.debug(event.data);

  if ( event.data instanceof Int32Array && Atomics.load(event.data, 0) === 0 ) {

    Atomics.store(event.data, 0, 1); 

    phyloop();
    
  }

  if ( event.data instanceof Set ) {
    for ( const x of event.data ) router(x.type, x.buffer, x.payload);
  }

  else router(event.data.type, event.data.buffer, event.data.payload);

}