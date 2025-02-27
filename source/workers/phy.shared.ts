import { QueryFilterFlags, Ray, World } from "@dimforge/rapier3d-compat";

import container from "~/entities/container/container.physics";

import { terrain } from "~/entities/terrain/terrain.physics";
import { cars } from "~/entities/car/car.physics";
import { drone } from "~/entities/drone/drone.physics";

import thornsPhysics from "~/entities/thorns/thorns.physics";
import pillarsPhysics from "~/entities/pillars/pillars.physics";

export const enum EntityType {
  Container,
  Terrain,
  Pillars,
  Thorns,
  Cars,
  Drone,
}

export type PhyQueueElement = { type: EntityType; payload: unknown; buffer?: ArrayBufferLike };

export class Phy {

  public world = new World({ x: 0, y: -9.0, z: 0 });
  public queue = new Set<Function>();
  public ray = new Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
  public point = new Float32Array(new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * 3));
  
  constructor(
    public pos: Float32Array,
    public dir: Float32Array,
  ) {

  }

  public phyloop() {

    for ( const fn of this.queue ) fn();
    
    this.world.step();

    requestAnimationFrame(() => this.phyloop());
  
  }

  public router(type: EntityType, buffer: ArrayBufferLike, payload: any) {

    switch ( type ) {
      case EntityType.Container: {
        container(this, new Float32Array(buffer))
      }; break;
      case EntityType.Cars: {
        cars(this, new Float32Array(buffer), payload)
      }; break;
      case EntityType.Terrain: {
        terrain(this, payload);
      }; break;
      case EntityType.Drone: {
        drone(this, payload);
      }; break;
      case EntityType.Pillars: {
        pillarsPhysics(this, payload);
      }; break;
      case EntityType.Thorns: {
        thornsPhysics(this, payload)
      }
    }

  }

  public process(query: Set<any>) {

    for ( const x of query ) this.router(x.type, x.buffer, x.payload);

    this.queue.add(() => {

      this.ray.origin.x = this.pos[0];
      this.ray.origin.y = this.pos[1];
      this.ray.origin.z = this.pos[2];
  
      this.ray.dir.x = this.dir[0] * 10;
      this.ray.dir.y = this.dir[1] * 10;
      this.ray.dir.z = this.dir[2] * 10;

      const hit = this.world.castRay(
        this.ray, 
        100, 
        false, 
        QueryFilterFlags.EXCLUDE_SENSORS, 
        0x000F000F ^ 0b001
      );

      if ( !hit ) return;

      const { x, y, z } = this.ray.pointAt(hit.timeOfImpact);

      this.point.set([x,y,z]);
        
    });

    this.phyloop();

  }

}
