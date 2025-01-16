import { mat4, vec3 } from "gl-matrix";

import { Renderer } from "ortho/source/renderer/renderer.model";
import { Creation } from "ortho/source/entity/creation.entity";

import { Scene } from "ortho/source/renderer/scene.model";
import { ProceduredMaterial } from "ortho/source/mesh/mesh.material";
// import { BlurPass } from "ortho/source/renderer/passes/blur.pass";

// Audio
import { createReverb } from "ortho/source/audio/fx/reverb.audio";
import { Light } from "ortho/source/renderer/light/light.model";
import { Observer } from "ortho/source/renderer/camera/camera.model";

export enum MeshLabels {
  CITA,
  MAIN,
  SIDE,
}

const warpRange = 1600;

const dec = new TextDecoder();

export default class BasicScene extends Scene {

  private treePositions = Array<vec3>();
  private spikePositions = Array<vec3>();

  constructor(override renderer: Renderer) {

    super(renderer, [
      new ProceduredMaterial(0, /* wgsl */`
        *color = vec4f(texel.xyz + distance, 1);
      `),
      new ProceduredMaterial(1, /* wgsl */`
  
        let base = vec3f(0.5);
        let shdw = dot(in.norm.xyz, vec3f(0.0,0.8,0.2)) * 0.25;
        let mist = fbm(in.globalCoords.yz / 100 + params.tick / 600) * 0.25;

        *color  = vec4f(base + shdw + distance + mist, 1);

      `),
      new ProceduredMaterial(2, /* wgsl */`
        *color = vec4f(mix(
          vec3f(1.0),
          vec3f(0.9),
          clamp(0.0, 1.0, fbm(in.globalCoords.xz * 0.05) * (1 - distance))
        ), 1);
      `),
      new ProceduredMaterial(3, /* wgsl */`
        *color = vec4f(vec3f(0.9,0.0,0.0) + distance, 1);
      `)
    ], {
      "ambient": new URL("../assets/audio/wind.wav", import.meta.url),
      "block": new URL("../assets/mesh/block.obj", import.meta.url),
      "car": new URL("../assets/mesh/car.obj", import.meta.url),
      "terrain": new URL("../assets/mesh/terrain.obj", import.meta.url),
      "lstr_m": new URL("../assets/mesh/char/lstr.obj", import.meta.url),
    } as const);

    // Attach blur post effect
    // this.renderer.postPasses.add(new BlurPass(renderer, this.actor.camera));

  }

  override async setupScene() {

    // @ts-ignore
    globalThis.camera = this.actor.camera;

    const resourses = await Promise.all(
      Object.entries(this.resourses).map(async ([ name, url ]) => {
        return {
          name,
          res: await fetch(url).then(x => x.arrayBuffer())
        };
      })
    );

    const queue = Array<Promise<any>>();

    for (const entry of resourses) {
      switch (entry.name as keyof typeof this.resourses) {
        case "ambient":
          this.ambient(entry.res); break;
        case "car":
          queue.push(this.cars(entry.res)); break;
        case "lstr_m":
          queue.push(this.lstr(entry.res)); break;
        case "terrain":
          queue.push(this.terrain(entry.res)); break;
      }
    }

    for (const entry of resourses) {
      switch (entry.name as keyof typeof this.resourses) {
        case "block":
          queue.push(this.blocks(entry.res)); break;
      }
    }

    // Динамический источник света
    const sun = new Light(new Observer());

    this.lightSources.add(sun);

    this.onpass.add(() => {
      sun.observer.position = vec3.add(
        [ 0, 0, 0 ],
        [ Math.sin(this.renderer.info.currentFrame / 1000) * 10, 30, 0 ],
        this.actor.camera.position
      );
      sun.observer.target = this.actor.camera.position;
      sun.observer.update();
    });

    this.onpass.add(() => {

      const pos = this.actor.camera.position;

      for (let i = 0; i < this.actor.camera.position.length; i++) {

        const abs_pos = Math.abs(pos[ i ]);

        if (abs_pos >= warpRange) pos[ i ] = abs_pos * -1 * warpRange;

      }

    });

    await Promise.all(queue);

  }

  private async terrain(data: ArrayBuffer) {

    const entity = await Creation.create({
      geometry: dec.decode(data),
      textures: null,
    }, this.renderer.materials.repo.get(2)!, {
      cast: false,
      recieve: true,
    }, 1, null);

    const model = entity.mesh.model;

    mat4.translate(model, model, [ 0, -80, 0 ]);
    mat4.scale(model, model, [
      500,
      500,
      500,
    ]);

    entity.mesh.writeModel = model;

    this.meshes.set("terrain", entity.mesh);

    const vertexes = entity.mesh.vertexes.deref();

    if ( !vertexes ) throw Error();

    for (let i = 0; i < vertexes.length; i += 3) {

      const current = vec3.transformMat4([ 0, 0, 0 ], [
        vertexes[ i + 0 ],
        vertexes[ i + 1 ],
        vertexes[ i + 2 ],
      ], model);

      current[ 1 ] += 9;

      if (this.treePositions.some(x => vec3.dist(x, current) < 60)) continue;

      this.treePositions[ this.treePositions.length ] = current;

    }

    this.drawQueue.push(entity.mesh);

  }

  private async cars(res: ArrayBuffer) {

    const amount = 20;
    const states = Array.from({ length: amount }, () => {

      const row = Math.floor(4 * Math.random());
      const col = Math.floor(4 * Math.random());

      return {
        row,
        col,
        speed: (1.0 + row * Math.random()) * -1 * 0.25
      };

    });

    const entity = await Creation.create({
      geometry: dec.decode(res),
      textures: null,
    }, this.renderer.materials.repo.get(1)!, {
      cast: true,
      recieve: false,

    }, amount, states);

    const baseAlt = 80;

    for (const [ model, index ] of entity.mesh.writeModels()) {
      mat4.translate(model, model, [
        states[ index ].col * 10,
        baseAlt + states[ index ].row * 20,
        200 * Math.random(),
      ]);
    }

    this.onpass.add(() => {
      for (const [ model, index ] of entity.mesh.writeModels()) {

        const isTurnPoint = Math.abs(model[ 14 ]) >= 500;

        if (isTurnPoint) {
          mat4.rotateY(model, model, 0.01);
        }

        mat4.translate(model, model, [
          0,
          0,
          states[ index ].speed,
        ]);

      }
    });

    this.drawQueue.push(entity.mesh);

  }

  private ambient(audioData: ArrayBuffer) {

    this.renderer.context.canvas.addEventListener("click", async () => {

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
        .connect(gainNode)
        .connect(stereoNode)
        .connect(convolver)
        .connect(auctx.destination)
        ;

      source.start();

      this.onpass.add(() => {

        const norm = vec3.normalize([ 0, 0, 0 ], vec3.sub([ 0, 0, 0 ], this.actor.camera.target, this.actor.camera.position));
        const cross = vec3.cross([ 0, 0, 0 ], [ 0, 1, 0 ], norm);

        const v = vec3.distance(this.actor.camera.position, [ 0, 0, 0 ]) / warpRange;

        pan -= (pan - cross[ 0 ]) * 0.075;

        gainNode.gain.value = 1.0 + Math.min(Math.max(v, 0), 3);
        stereoNode.pan.value = Math.max(-0.9, Math.min(0.9, pan));
      });

    }, { once: true });

  }

  private async blocks(data: ArrayBuffer) {

    { // Large ones

      const entity = await Creation.create({
        geometry: dec.decode(data),
        textures: null,
      }, this.renderer.materials.repo.get(1)!, {
        cast: true,
        recieve: false,
      }, 50, null);

      for (const [ model ] of entity.mesh.writeModels()) {

        mat4.scale(model, model, [
          10,
          500,
          10,
        ]);

        mat4.translate(
          model,
          model,
          [
            -100 + 200 * Math.random(),
            0.0,
            -100 + 200 * Math.random()
          ]
        );
      }

      this.drawQueue.push(entity.mesh);

    }

    { // Small ones

      const terrain = this.meshes.get("terrain")!;
      
      const vertexes = terrain.vertexes.deref();

      if ( !vertexes ) throw Error("Terrain vertexes already removed by GC");

      for (let i = 0; i < vertexes.length; i += 3) {

        const current = vec3.transformMat4([ 0, 0, 0 ], [
          vertexes[ i + 0 ],
          vertexes[ i + 1 ],
          vertexes[ i + 2 ],
        ], terrain.model);

        const d_occupied = this.spikePositions.some(x => {
          return vec3.dist(x, current) < 20;
        });

        const p_occupied = this.treePositions.some(y => {
          return current[ 0 ] === y[ 0 ] && current[ 1 ] === y[ 1 ] && current[ 2 ] === y[ 2 ];
        });

        if (d_occupied || p_occupied) continue;

        // if ( this.spikePositions.length > 50 ) break;

        this.spikePositions[ this.spikePositions.length ] = current;

      }

      const entity = await Creation.create({
        geometry: dec.decode(data),
        textures: null,
      }, this.renderer.materials.repo.get(1)!, {
        cast: true,
        recieve: false,
      }, this.spikePositions.length - 1, null);

      for (const [ model, index ] of entity.mesh.writeModels()) {

        mat4.translate(
          model,
          model,
          this.spikePositions[ index ]
        );

        mat4.rotate(model, model, Math.random() * 0.5, [
          Math.random(),
          1,
          Math.random(),
        ]);

        mat4.scale(model, model, [
          0.25,
          25 + 10 * Math.random(),
          0.25,
        ]);

      }

      this.drawQueue.push(entity.mesh);

    }

  }

  private async lstr(data: ArrayBuffer) {

    const entity = await Creation.create({
      geometry: dec.decode(data),
      textures: [
        "./textures/lstr.png"
      ],
    }, this.renderer.materials.repo.get(0)!, {
      cast: true,
      recieve: false,
    }, 1, null);

    const model = entity.mesh.model as mat4;

    mat4.translate(model, model, [ 0, -11.5, 5 ]);
    mat4.rotateY(model, model, Math.PI / 4);
    mat4.scale(model, model, [ 3, 3, 3 ]);

    entity.mesh.writeModel = mat4.translate(model, model, [ 0, 0.5, 0 ]);

    this.drawQueue.push(entity.mesh);

  }

}
