import { DirectionLight, ProceduredMaterial, Renderer, Scene } from "ortho"

import { vec3 } from "gl-matrix";

import { latern } from "./entities/latern.entity"
import { lstr } from "./entities/lstr.entity";

import { cars } from "./entities/car/car.model";
import { terrain } from "./entities/terrain/terrain.model";
import { container } from "./entities/container/container.model";

import pillars from "./entities/pillars/pillars.model";
import thorns from "./entities/thorns/thorns.model";

import { ambient, warpRange } from "./ambient.sfx";
import { drone } from "./entities/drone/drone.model";

export default class BasicScene extends Scene {

  static readonly resources = {
    "ambient" : new URL("~/assets/audio/wind.wav", import.meta.url),
    "block"   : new URL("~/assets/mesh/block.obj", import.meta.url),
    "car"     : new URL("~/assets/mesh/car.obj", import.meta.url),
    "terrain" : new URL("~/assets/mesh/terrain.obj", import.meta.url),
    "plane"   : new URL("~/assets/mesh/plane.obj", import.meta.url),
    "lstr_m"  : new URL("~/assets/mesh/char/lstr.obj", import.meta.url),
  }

  public phyQueue = new Set<Function>();

  private treePositions = Array<vec3>();
  private spikePositions = Array<vec3>();

  constructor(override renderer: Renderer) {

    super(renderer, [
      new ProceduredMaterial(0, /* wgsl */`
        color = textureSample(texture, textureSampler, in.textureUV);
      `),
      new ProceduredMaterial(1, /* wgsl */`
  
        color = vec4f(vec3f(0.66),1);

      `),
    ]);

    // Attach blur post effect
    // if ( false ) this.renderer.postPasses.add(new BlurPass(renderer, this.actor.camera));

  }

  override async setupScene() {

    const resourses = await Promise.all(
      Object.entries(BasicScene.resources).map(async ([ name, url ]) => {
        return {
          name,
          res: await fetch(url).then(x => x.arrayBuffer())
        };
      })
    );

    const queue = Array<Promise<any>>();

    { // TODO: Пока дрон без меша.
      drone(new ArrayBuffer(0), this);
    }

    for (const entry of resourses) {
      switch (entry.name) {
        case "ambient":
          ambient(entry.res, this); break;
        case "car":
          queue.push(cars(entry.res, this)); break;
        case "lstr_m":
          queue.push(lstr(entry.res, this)); break;
        case "terrain":
          queue.push(terrain(entry.res, this, this.treePositions)); break;
      }
    }

    await Promise.all(queue);

    for (const entry of resourses) {
      switch (entry.name) {
        case "block":
          queue.push(container(entry.res, this)); 
          queue.push(latern(entry.res, this));
          queue.push(pillars(entry.res, this));
          queue.push(thorns(entry.res, this, {
            outPositions: this.spikePositions,
            pickedPositions: this.treePositions,
          }));
          break;
      }
    }


    this.onpass.add(() => {

      for ( const f of this.phyQueue ) f();

      const pos = this.actor.camera.position;

      for (let i = 0; i < this.actor.camera.position.length; i++) {

        const abs_pos = Math.abs(pos[ i ]);

        if (abs_pos >= warpRange) pos[ i ] = abs_pos * -1 * warpRange;

      }

      const observer = this.sun.observers.at(-1)!;
      const delta = this.renderer.info.currentFrame / 1000;

      vec3.add(observer.position, [ 
        10 * Math.sin(delta), 
        10 + 30 * (Math.cos(delta) * 0.5 + 0.5), 
        10 * Math.cos(delta),
      ], this.actor.camera.position);
      
      observer.target.set(this.actor.camera.position);
      observer.update();

    });

    await Promise.all(queue);

  }

}
