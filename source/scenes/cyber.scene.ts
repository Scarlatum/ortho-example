import { ProceduredMaterial, Renderer, Scene, Ortho, BlurPass, SSAOPass } from "ortho"
import { parallelFetch } from "ortho/source/utils/networking.utils.ts"

import { latern } from "~/entities/latern.entity"
import { lstr as LSTR } from "~/entities/lstr.entity";
import { FKLR } from "~/entities/fklr.entity";

import { cars } from "~/entities/car/car.model";
import { terrain } from "~/entities/terrain/terrain.model";
import { container } from "~/entities/container/container.model";

import pillars from "~/entities/pillars/pillars.model";
import thorns from "~/entities/thorns/thorns.model";

import { ambient } from "./ambient.sfx";
import { drone } from "~/entities/drone/drone.model";
import { Creation } from "ortho/source/entity/creation.entity";
import { Actor } from "ortho/source/entity/actor.entity";

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
    "texture::banr::diffuse": new URL("~/assets/textures/banners/003.webp", import.meta.url),
    "texture::car::diffuse": new URL("~/assets/textures/car.png", import.meta.url),
		"texture::terrain::diffuse": new URL("~/assets/textures/terrain.webp", import.meta.url),
  } satisfies Record<`${ AssetLabels }::${ string }`, URL>

  private actor: Actor;
  private treePositions = Array<Ortho.vec3>();
  private spikePositions = Array<Ortho.vec3>();

  public hitpos: Nullable<Float32Array> = null;

  constructor(override renderer: Renderer) {

    const materials = [
      new ProceduredMaterial(0, /* wgsl */`
        color = textureSample(texture, textureSampler, in.uv).rgb;
      `),
      new ProceduredMaterial(1, /* wgsl */`
        color = vec3f(0.75);
      `),
      new ProceduredMaterial(2, /* wgsl */`
        color = textureSample(
          texture, 
          textureSampler, 
          fract(in.uv * 8.0 + (fbm(in.world.xz * 0.005) * 0.25))
        ).rgb;
      `),
      new ProceduredMaterial(4, /* wgsl */`

        // let clouds_shadow = noise(in.world.xz / 300);

        color = vec3f(0.75);

      `),
    ];

    const fragments = [
      /* wgsl */`

        // let mist = noise(in.world.yz / 300 + params.tick / 1200) * MIST_DENSITY;

        let fog = abs(dist) / FOG_DISTANCE * FOG_DENSITY;

        color = mix(color, ambt, fog * 2);

      `,
    ]

    super(renderer, materials, fragments);

    this.actor = new Actor(this, this.camera);

    // Attach blur post effect
    // this.renderer.addPostPass(new BlurPass(renderer, {
    //   iterations: 1
    // }));

    // Attach SSAO pass
    // this.renderer.addPostPass(new SSAOPass(renderer));

  }

  override async setupScene() {

    this.actor.applyListeners(this.renderer.context.canvas as HTMLCanvasElement);

    const resourses = await parallelFetch(Object.entries(BasicScene.resources))

    const queue = Array<Promise<any>>();

    const flkr_meshes = Array() as Parameters<typeof FKLR>[1];
    const lstr_meshes = Array() as Parameters<typeof LSTR>[1];

    const flkr_textures = Creation.createTextureContainer();
    const lstr_textures = Creation.createTextureContainer();
    const banr_textures = Creation.createTextureContainer();
    const car_textures  = Creation.createTextureContainer();
		const terrain_textures = Creation.createTextureContainer();

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
        // case "texture::car::diffuse":
        //   await Scene.setTexture(entry.res, car_textures, "diffuse"); 
        //   resourses.delete(entry);
        //   break;
				// case "texture::terrain::diffuse":
				// 	await Scene.setTexture(entry.res, terrain_textures, "diffuse");
				// 	resourses.delete(entry);
				// 	break;
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
          cars(this, Symbol("car mesh"), entry.res, null);
          resourses.delete(entry);
          break;
        case "mesh::terrain":
          queue.push(terrain(this, entry.res, this.treePositions, null));
          resourses.delete(entry);
          break;
        case "mesh::lstr":
          lstr_meshes[0] = entry.res;
          resourses.delete(entry); 
          break;
        case "mesh::flkr":
          flkr_meshes[0] = entry.res;
          resourses.delete(entry); 
          break;
        case "mesh::spear":
          flkr_meshes[1] = entry.res;
          resourses.delete(entry); 
          break;
      }
    }

    await Promise.all(queue);

    drone(new ArrayBuffer(0), this);

    FKLR(this, flkr_meshes, flkr_textures);
    LSTR(this, lstr_meshes, lstr_textures);

    for (const entry of resourses) {
      switch (entry.name) {
        case "mesh::block":

          const id = Symbol("block mesh");

          queue.push(container(id, entry.res, this)); 
          queue.push(pillars(this, id, entry.res, banr_textures));
          queue.push(latern(id, entry.res, this));
          queue.push(thorns(id, entry.res, this, {
            outPositions: this.spikePositions,
            pickedPositions: this.treePositions,
          }));

          resourses.delete(entry);

          break;
          
      }
    }

    { // Sun update

      this.onpass.add(() => {

        const time = this.renderer.info.currentFrame / 15_000;

        for ( let i = 0; i < this.sun.observers.length; i++ ) {

          const origin: Ortho.vec3 = [0,0,0];

          const observer  = this.sun.observers[i];
          const offset    = (512 >> 2 * i);

          Ortho.vec3.mul(origin, this.camera.direction, [
            offset + this.camera.aspect,
            0,
            offset,
          ]);

          Ortho.vec3.add(origin, this.camera.position, origin);
          Ortho.vec3.add(observer.position, [
            500 * Math.sin(time),
            500,
            500 * Math.cos(time),
          ], origin);
          
          observer.target.set(origin);

        }

      })

    }

    if ( import.meta.env.DEV ) addEventListener("keydown", event => {
      if (event.key === "1" ) {
        this.sun.needsUpdate = !this.sun.needsUpdate;
      } else if ( event.key === "2" ) {
        this.sun.debugCascade = !this.sun.debugCascade;
      } else if ( event.key === "3" ) {
        Scene.LIGHT_PASS = !Scene.LIGHT_PASS;
      } else if ( event.key === "4" ) {
        Scene.SHADOW_PASS = !Scene.SHADOW_PASS;
      }
    });

    await Promise.all(queue);

    return this;

  }

}
