import { mat4, quat, vec2, vec3 } from "gl-matrix";

import { Creation } from "ortho/source/entity/creation.entity";
import { Renderer } from "ortho/source/renderer/renderer.model";
import BasicScene from "../../scenes/cyber.scene";
import { PointLight } from "ortho/source/renderer/light/point.model";

import { createPhyBuffer } from "~/main"
import { CONTAINER_QUANTITY, CONTAINER_SIZE } from "./container.shared";
import { EntityType } from "~/workers/phy.shared";
import { LightCascade } from "ortho/source/renderer/light/light.model";

export async function container(
  sym: symbol,
  data: ArrayBuffer, 
  scene: BasicScene,
) {

  const entity = await Creation.create(sym, {
    geometry: Renderer.dec.decode(data),
    textures: null,
  }, scene.renderer.materials.repo.get(1)!, {
    instaces: CONTAINER_QUANTITY,
    shadow: {
      cast: true,
      recieve: true,
    },
  });

  const phy = createPhyBuffer(
    EntityType.Container, 
    Float32Array.BYTES_PER_ELEMENT * 7 * CONTAINER_QUANTITY, 
  );

  scene.add(entity.mesh);
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