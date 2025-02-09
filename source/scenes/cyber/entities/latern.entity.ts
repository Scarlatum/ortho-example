import { mat4, vec3 } from "gl-matrix";
import { Creation } from "ortho/source/entity/creation.entity";
import { SceneInterface } from "ortho/source/interfaces/scene.interface";
import { PointLight } from "ortho/source/renderer/light/point.model";
import { Renderer } from "ortho/source/renderer/renderer.model";

export async function latern(data: ArrayBuffer, scene: SceneInterface) {

  const colors = [
    [1.0,0.0,0.0] as vec3,
    [0.0,1.0,0.0] as vec3,
    [0.0,0.0,1.0] as vec3,
    [1.0,0.0,1.0] as vec3,
    [0.0,1.0,1.0] as vec3,
    [1.0,1.0,0.0] as vec3,
  ] as const;

  for ( let i = 0; i < colors.length; i++ ) {

    const time_offset = Math.PI * 2 / colors.length * i * 1000;

    const { mesh, state } = await Creation.create({
      geometry: Renderer.dec.decode(data),
      textures: null,
    }, scene.renderer.materials.repo.get(2)!, {
      cast: true,
      recieve: true,
    }, 1, {
      position: [ 0,0,0 ] as vec3,
    });

    const x = new PointLight();

    x.visible 		= true;
    x.color		 	  = colors[i];
    x.range 			= 8.0;

    scene.onpass.add(() => {

      using model = mesh.model;

      state!.position = x.position = [
        50 * Math.cos((scene.renderer.info.currentFrame + time_offset) / 1000),
        30 + 5 * Math.cos((scene.renderer.info.currentFrame + time_offset) / 250),
        50 * Math.sin((scene.renderer.info.currentFrame + time_offset) / 1000)
      ];

      mat4.identity(model);
      mat4.translate(model, model, state!.position);
      mat4.rotate(model, model, scene.renderer.info.currentFrame / 250, [1,1,1]);

    });

    scene.drawQueue.add(mesh);

  }

}