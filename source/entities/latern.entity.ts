import { mat4, vec3 } from "gl-matrix";
import { Creation } from "ortho/source/entity/creation.entity";
import { SceneInterface } from "ortho/source/interfaces/scene.interface";
import { LightCascade } from "ortho/source/renderer/light/light.model";
import { PointLight } from "ortho/source/renderer/light/point.model";
import { Renderer } from "ortho/source/renderer/renderer.model";

export async function latern(sym: symbol, data: ArrayBuffer, scene: SceneInterface) {

  const colors = [
    [1.0,0.0,0.0] as vec3,
    [0.0,1.0,0.0] as vec3,
    [0.0,0.0,1.0] as vec3,
    [1.0,0.0,1.0] as vec3,
    [0.0,1.0,1.0] as vec3,
    [1.0,1.0,0.0] as vec3,
  ] as const;

  const t = 150;

  for ( let i = 0; i < colors.length; i++ ) {

    const time_offset = Math.PI * 2 / colors.length * i * t;

    const { mesh, state } = await Creation.create(sym, {
      geometry: Renderer.dec.decode(data),
      textures: null,
    }, scene.renderer.materials.repo.get(2)!, {
      shadow: {
        cast: true,
        recieve: false,
        cascade: LightCascade.Close | LightCascade.Near | LightCascade.Far,
      },
      state: {
        position: new Float32Array([ 0,0,0 ])
      }
    });

    const x = new PointLight();

    x.visible 		= true;
    x.color		 	  = colors[i];
    x.range 			= 8.0;

    scene.onpass.add(() => {

      using model = mesh.model;

      state!.position[0] = x.position[0] = 50 * Math.cos((scene.renderer.info.currentFrame + time_offset) /   t) - 20;
      state!.position[1] = x.position[1] = 10 * Math.cos((scene.renderer.info.currentFrame + time_offset) / 250) + 30;
      state!.position[2] = x.position[2] = 50 * Math.sin((scene.renderer.info.currentFrame + time_offset) /   t) + 20;

      mat4.identity(model);
      mat4.translate(model, model, state.position);
      mat4.rotate(model, model, scene.renderer.info.currentFrame / 250, [1,1,1]);

    });

    scene.add(mesh);

  }

}