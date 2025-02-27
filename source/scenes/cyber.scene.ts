import { ProceduredMaterial, Renderer, Scene, Ortho, BlurPass } from "ortho"

import { latern } from "~/entities/latern.entity"
import { lstr as LSTR } from "~/entities/lstr.entity";
import { FKLR } from "~/entities/fklr.entity";

import { cars } from "~/entities/car/car.model";
import { terrain } from "~/entities/terrain/terrain.model";
import { container } from "~/entities/container/container.model";

import pillars from "~/entities/pillars/pillars.model";
import thorns from "~/entities/thorns/thorns.model";

import { ambient, warpRange } from "./ambient.sfx";
import { drone } from "~/entities/drone/drone.model";
import { TextureContainer } from "ortho/source/entity/creation.entity";

type AssetLabels = "audio" | "mesh" | "texture";

export default class BasicScene extends Scene {

  static readonly resources = {
    // Audio
    "audio::ambient" : new URL("~/assets/audio/wind.wav", import.meta.url),
    // Base Models
    "mesh::block"   : new URL("~/assets/mesh/block.obj", import.meta.url),
    "mesh::car"     : new URL("~/assets/mesh/car.obj", import.meta.url),
    "mesh::terrain" : new URL("~/assets/mesh/terrain.obj", import.meta.url),
    "mesh::plane"   : new URL("~/assets/mesh/plane.obj", import.meta.url),
    // Chars
    "mesh::lstr"  : new URL("~/assets/mesh/char/lstr.obj", import.meta.url),
    "mesh::flkr"  : new URL("~/assets/mesh/char/fklr.obj", import.meta.url),
    "mesh::spear" : new URL("~/assets/mesh/char/spear.obj", import.meta.url),
    // Textures
    "texture::lstr::diffuse": new URL("~/assets/textures/lstr.png", import.meta.url),
    "texture::fklr::diffuse": new URL("~/assets/textures/fklr.png", import.meta.url),
    "texture::banr::diffuse": new URL("~/assets/textures/banner.png", import.meta.url),
  } satisfies Record<`${ AssetLabels }::${ string }`, URL>

  public phyQueue = new Set<Function>();

  private treePositions = Array<Ortho.vec3>();
  private spikePositions = Array<Ortho.vec3>();

  public hitpos: Nullable<Float32Array> = null;

  constructor(override renderer: Renderer) {

    super(renderer, [
      new ProceduredMaterial(0, /* wgsl */`
        color = pow(textureSample(texture, textureSampler, in.uv).rgb, vec3f(2.0));
      `),
      new ProceduredMaterial(1, /* wgsl */`
        color = vec3f(0.75);
      `),
      new ProceduredMaterial(2, /* wgsl */`
        color = textureSample(
          texture, 
          textureSampler, 
          fract(in.uv * vec2f(10, 120))
        ).rgb;
      `),
    ], [
      /* wgsl */`

        let mist = noise(in.world.yz / 100 + params.tick / 600) * MIST_DENSITY;
        let fog = abs(dist) / FOG_DISTANCE * FOG_DENSITY;

        color = mix(color, ambt, fog * 2) + mist;

      `,
    ]);

    // Attach blur post effect
    // this.renderer.addPostPass(new BlurPass(renderer, {
    //   iterations: 1
    // }));

  }

  override async setupScene() {

    const resourses = new Set(await Promise.all(
      Object.entries(BasicScene.resources).map(async ([ name, url ]) => {
        return {
          name: name as keyof typeof BasicScene.resources,
          res: await fetch(url).then(x => x.arrayBuffer())
        };
      })
    ));

    const queue = Array<Promise<any>>();

    { // TODO: Пока дрон без меша.
      drone(new ArrayBuffer(0), this);
    }

    const flkr_data = Array() as [ ArrayBuffer, ArrayBuffer ];
    const lstr_data = Array() as [ ArrayBuffer, ArrayBuffer ];

    const flkr_textures = {} as TextureContainer;
    const lstr_textures = {} as TextureContainer;
    const banr_textures = {} as TextureContainer;

    for ( const entry of resourses ) {
      switch (entry.name) {
        case "texture::lstr::diffuse":
          await Scene.setTexture(entry.res, lstr_textures, "diffuse"); 
          resourses.delete(entry);
          break;
        case "texture::fklr::diffuse":
          await Scene.setTexture(entry.res, flkr_textures, "diffuse"); 
          resourses.delete(entry);
          break;
        case "texture::banr::diffuse":
          await Scene.setTexture(entry.res, banr_textures, "diffuse"); 
          resourses.delete(entry);
          break;
      }
    }

    await Promise.all(queue);

    for (const entry of resourses) {
      switch (entry.name) {
        case "audio::ambient":
          ambient(entry.res, this);
          resourses.delete(entry);
          break;
        case "mesh::car":
          cars(Symbol("car mesh"), entry.res, this);
          resourses.delete(entry);
          break;
        case "mesh::terrain":
          queue.push(terrain(entry.res, this, this.treePositions));
          resourses.delete(entry);
          break;
        case "mesh::lstr":
          lstr_data[0] = entry.res;
          resourses.delete(entry); 
          break;
        case "mesh::flkr":
          flkr_data[0] = entry.res;
          resourses.delete(entry); 
          break;
        case "mesh::spear":
          flkr_data[1] = entry.res;
          resourses.delete(entry); 
          break;
      }
    }

    await Promise.all(queue);

    FKLR(this, flkr_data, flkr_textures);
    LSTR(this, lstr_data, lstr_textures);

    for (const entry of resourses) {
      switch (entry.name) {
        case "mesh::block":

          const id = Symbol("block mesh");

          queue.push(container(id, entry.res, this)); 
          queue.push(pillars(this, id, entry.res, banr_textures));
          // barrierQueue.push(latern(id, entry.res, this));
          queue.push(thorns(id, entry.res, this, {
            outPositions: this.spikePositions,
            pickedPositions: this.treePositions,
          }));

          resourses.delete(entry);

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

      const observers = this.sun.observers;
      const origin = [0,0,0] as Ortho.vec3;

      for ( let i = 0; i < observers.length; i++ ) {

        const observer = observers[i];

        const offset = 512 >> 2 * i;
  
        Ortho.vec3.scale(origin, this.actor.camera.direction, offset);
        Ortho.vec3.mul(origin, origin, [1,0,1]);
        Ortho.vec3.add(origin, this.actor.camera.position, origin);
        Ortho.vec3.add(observer.position, [
          500 * Math.cos(this.renderer.info.currentFrame / 25_000),
          500,
          500 * Math.sin(this.renderer.info.currentFrame / 25_000),
        ], origin);
        
        observer.target.set(origin);
        observer.update();

      }

    });

    await Promise.all(queue);

    return this;

  }

}
