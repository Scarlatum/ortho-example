import { Renderer, Creation } from "ortho";
import { mat4, quat, vec3 } from "gl-matrix";

import { phyQueue } from "~/main"

import BasicScene from "~/scenes/cyber.scene";
import { TerrainWTO } from "./terrain.shared";
import { EntityType } from "~/workers/phy.shared";
import { InstancedMesh } from "ortho/source/mesh/mesh.model";
import { DirectionLight, LightCascade } from "ortho/source/renderer/light/light.model";

export async function terrain(
  data: ArrayBuffer, 
  scene: BasicScene,
  positions: Array<vec3>,
) {

  const sym = Symbol("terrain");

  const material = scene.renderer.materials.repo.get(1)!;

  const terrain = await Creation.create(sym, {
    geometry: Renderer.dec.decode(data),
    textures: null,
    // textures: [
    //   {["./textures/marble.png"]: []}
    // ]
  }, material, {
    instaces: 1,
    shadow: { cast: false, recieve: true }
  });

  scene.meshes.set("terrain", terrain.mesh);

  const vertexes = terrain.mesh.data.vertexes.deref();

  if ( !vertexes ) throw Error();

  using model = terrain.mesh.model;

  mat4.translate(model, model, [ 0, -80, 0 ]);
  mat4.scale(model, model, [
    500,
    500,
    500,
  ]);

  phyQueue.add({
    type: EntityType.Terrain,
    payload: {
      model,
      vertexes,
    } satisfies TerrainWTO
  });

  setPositions(vertexes, model, positions);

  // for ( const [ model, index ] of terrain.mesh.writeModels() ){

  //   switch (index) {
  //     case 0:

  //       mat4.translate(model, model, [ 0, -80, 0 ]);
  //       mat4.scale(model, model, [
  //         500,
  //         500,
  //         500,
  //       ]);

  //       phyQueue.add({
  //         type: EntityType.Terrain,
  //         payload: {
  //           model,
  //           vertexes,
  //         } satisfies TerrainWTO
  //       });

  //       setPositions(vertexes, model, positions);

  //       break;
  //     case 1: 

  //       const q = quat.create();

  //       quat.rotateX(q, q, Math.PI);
  //       mat4.fromRotationTranslationScale(model, q, [0,250,0], [500,500,500])

  //   }

  // }

  scene.drawQueue.add(terrain.mesh);

}

function setPositions(vertexes: Float32Array, model: Float32Array, positions: vec3[]) {

  const step = 2;

  vertexLoop: for (let i = 0; i < vertexes.length; i += 3 * step) {

    const current = vec3.transformMat4([ 0, 0, 0 ], [
      vertexes[ i + 0 ],
      vertexes[ i + 1 ],
      vertexes[ i + 2 ],
    ], model);

    current[ 1 ] += 9;

    for (let i = 0; i < positions.length; i++) {

      const dist = vec3.dist(positions[ i ], current);

      if (dist < 60) continue vertexLoop;

    }

    positions.push(current);

  }
}