import { mat4, quat, vec2, vec3 } from "gl-matrix";

import { Creation } from "ortho/source/entity/creation.entity";
import { Renderer } from "ortho/source/renderer/renderer.model";
import BasicScene from "../../cyber.scene";
import { PointLight } from "ortho/source/renderer/light/point.model";

import { createPhyBuffer } from "~/main"
import { CONTAINER_QUANTITY, CONTAINER_SIZE } from "./container.shared";
import { EntityType } from "~/workers/phy.worker";

export async function container(
  data: ArrayBuffer, 
  scene: BasicScene,
) {

  const entity = await Creation.create({
    geometry: Renderer.dec.decode(data),
    textures: null,
  }, scene.renderer.materials.repo.get(1)!, {
    cast: true,
    recieve: true,
  }, CONTAINER_QUANTITY);

  const phy = createPhyBuffer(
    EntityType.Container, 
    Float32Array.BYTES_PER_ELEMENT * 7 * CONTAINER_QUANTITY, 
  );

  scene.drawQueue.add(entity.mesh);
  scene.onpass.add(() => {

    for ( const [ model, index ] of entity.mesh.writeModels() ) {

      const offset = 7 * index;

      const q = phy.subarray(0 + offset,4 + offset);
      const v = phy.subarray(4 + offset,7 + offset);

      mat4.identity(model);
      mat4.fromRotationTranslationScale(model, 
        q, 
        v, 
        CONTAINER_SIZE
      );

    }
  })

}