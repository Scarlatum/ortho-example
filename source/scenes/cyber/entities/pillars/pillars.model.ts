import { mat4, quat, vec2, vec3 } from "gl-matrix";
import { Creation, Renderer, PointLight } from "ortho";
import { phyQueue } from "~/main";

import BasicScene from "~/scenes/cyber/cyber.scene";
import { EntityType } from "~/workers/phy.worker";
import { PillarsWTO } from "./pilars.shared";

export default async function(data: ArrayBuffer, scene: BasicScene) {

  const meshFile = Renderer.dec.decode(data);

  const pillarSideSize = 15;
  const q = quat.identity([0,0,0,0]);

  const pillar = await Creation.create({
    geometry: meshFile,
    textures: null,
  }, scene.renderer.materials.repo.get(1)!, {
    cast: true,
    recieve: false,
  }, 30, Array.from({ length: 30 }, () => {

    const x = -500 + 1000 * Math.random();
    const z = -500 + 1000 * Math.random();

    const pos = [ x, 0, z ] as vec3;
    const scl = [ pillarSideSize, 500, pillarSideSize ] as vec3;

    return Object.seal({
      rot: q, 
      pos: pos,
      scl: scl,
      mdl: mat4.fromRotationTranslationScale(mat4.create(), q, pos, scl)
    });

  }));

  const wto: PillarsWTO = {
    collisionBoxes: Array<Float32Array>(pillar.mesh.instances)
  }

  for (const [ model, i ] of pillar.mesh.writeModels()) {

    const state = pillar.state![i];

    model.set(state.mdl);

    const transformedBox = pillar.mesh.edges.map(x => vec3.transformMat4([0,0,0], x, model));

    wto.collisionBoxes[i] = new Float32Array(transformedBox.flat(2) as number[]);

  }

  phyQueue.add({
    type: EntityType.Pillars,
    payload: wto
  });

  { // Display

    const width = pillarSideSize - 1;
    const sizes = [0,0] as vec2;

    const light = new PointLight();
    const entity = await Creation.create({
      geometry: meshFile,
      textures: [{
        ["./image/owl@512.png"]: [
          "./image/owl@256.png"
        ]
      }],
    }, scene.renderer.materials.repo.get(2)!, {
      cast: true,
      recieve: false,
    }, 1, null, sizes);

    using model = entity.mesh.model;

    const [ closestPillar ] = pillar.state!.toSorted((a,b) => {
      return vec3.dist(a.pos, [0,0,0]) - vec3.dist(b.pos, [0,0,0]);
    });

    closestPillar.pos[0] -= pillarSideSize + 0.25;
    closestPillar.pos[1] += 75.0;

    const pos = vec3.clone(closestPillar.pos);
    const rot = quat.create();

    light.visible   = true;
    light.color		  = [0.1,0.1,0.3];
    light.range 	  = 64.0;
    light.position  = vec3.sub(pos, pos, [32,0,0]);

    quat.fromEuler(rot, 90, 90, 180);
    mat4.fromRotationTranslationScale(
      model, 
      rot, 
      closestPillar.pos, 
      [width,0.05,width * (sizes[1] / sizes[0])]
    );

    scene.drawQueue.add(entity.mesh);
    scene.onpass.add(() => {
      light.range = 16 + 8 * (Math.sin(scene.renderer.info.currentFrame / 60) * 0.5 + 0.5);
    })

  }

  scene.drawQueue.add(pillar.mesh);

}