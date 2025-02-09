import { Renderer, Creation } from "ortho";
import { mat4, vec3 } from "gl-matrix";

import { phyQueue } from "~/main"

import BasicScene from "~/scenes/cyber/cyber.scene";
import { TerrainWTO } from "./terrain.shared";
import { EntityType } from "~/workers/phy.worker";

export async function terrain(
  data: ArrayBuffer, 
  scene: BasicScene,
  positions: Array<vec3>,
) {

  const entity = await Creation.create({
    geometry: Renderer.dec.decode(data),
    textures: null,
  }, scene.renderer.materials.repo.get(1)!, {
    cast: false,
    recieve: true,
  }, 1, null);

  using model = entity.mesh.model;

  mat4.translate(model, model, [ 0, -80, 0 ]);
  mat4.scale(model, model, [
    500,
    500,
    500,
  ]);

  scene.meshes.set("terrain", entity.mesh);

  const vertexes = entity.mesh.data.vertexes.deref();

  if ( !vertexes ) throw Error();

  vertexLoop: for (let i = 0; i < vertexes.length; i += 3) {

    const current = vec3.transformMat4([ 0, 0, 0 ], [
      vertexes[ i + 0 ],
      vertexes[ i + 1 ],
      vertexes[ i + 2 ],
    ], model);

    current[ 1 ] += 9;

    for ( let i = 0; i < positions.length; i++ ) {

      const dist = vec3.dist(positions[i], current);

      if ( dist < 60 ) continue vertexLoop;

    }

    positions.push(current);

  }

  scene.drawQueue.add(entity.mesh);

  phyQueue.add({
    type: EntityType.Terrain,
    payload: {
      model,
      vertexes,
    } satisfies TerrainWTO
  });

}