import { mat4 } from "gl-matrix";
import { Creation } from "ortho/source/entity/creation.entity";
import { SceneInterface } from "ortho/source/interfaces/scene.interface";
import { Renderer } from "ortho/source/renderer/renderer.model";

export async function lstr(data: ArrayBuffer, scene: SceneInterface) {

  const entity = await Creation.create({
    geometry: Renderer.dec.decode(data),
    textures: [
      {["./textures/lstr.png"]: []}
    ],
  }, scene.renderer.materials.repo.get(0)!, {
    cast: true,
    recieve: false,
  }, 1, null);

  using model = entity.mesh.model;

  mat4.translate(model, model, [ 0, -10.5, 5 ]);
  mat4.rotateY(model, model, Math.PI / 4);
  mat4.scale(model, model, [ 1.5, 1.5, 1.5 ]);

  mat4.translate(model, model, [ 0, 0.5, 0 ]);

  scene.drawQueue.add(entity.mesh);

}