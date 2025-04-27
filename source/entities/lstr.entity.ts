import { mat4 } from "gl-matrix";
import { Creation, TextureContainer } from "ortho/source/entity/creation.entity";
import { SceneInterface } from "ortho/source/interfaces/scene.interface";
import { LightCascade } from "ortho/source/renderer/light/light.model";
import { Renderer } from "ortho/source/renderer/renderer.model";

export async function lstr(scene: SceneInterface, meshes: [ ArrayBuffer ], textures: TextureContainer) {

  const entity = await Creation.create(Symbol("LSTR"), {
    geometry: Renderer.dec.decode(meshes[0]),
    textures,
  }, scene.renderer.materials.repo.get(0)!, {
    instaces: 1,
    shadow: {
      cast: true,
      recieve: false,
      cascade: LightCascade.Close | LightCascade.Near,
    }
  });

  using model = entity.mesh.model;

  mat4.translate(model, model, [ 0, -8.9, 0 ]);
  mat4.rotateY(model, model, Math.PI / -3);

  scene.add(entity.mesh);

}