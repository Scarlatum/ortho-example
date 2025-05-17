import { mat4, quat, vec3 } from "gl-matrix";
import { Creation, TextureContainer } from "ortho/source/entity/creation.entity";
import { SceneInterface } from "ortho/source/interfaces/scene.interface";
import { LightCascade } from "ortho/source/renderer/light/light.model";
import { Renderer } from "ortho/source/renderer/renderer.model";
export async function FKLR(
  scene: SceneInterface,
  meshes: [ ArrayBuffer, ArrayBuffer ],
  textures: TextureContainer,
) {

  const sharedMaterial = scene.getMaterial(0);

  const FLKR = await Creation.create(Symbol("FKLR"), {
    geometry: Renderer.dec.decode(meshes[0]),
    textures,
  }, scene.renderer.materials.repo.get(0)!, {
    shadow: {
      cast: true,
      recieve: false,
      cascade: LightCascade.Close | LightCascade.Near
    },
    state: {
      anchor: [0, 3, 10] as vec3,
      position: [0, 3, 10] as vec3
    }
  });

  const SPEAR = await Creation.create(Symbol("FKLR SPEAR"), {
    geometry: Renderer.dec.decode(meshes[1]),
    textures: null,
  }, sharedMaterial, {
    instaces: 12,
    shadow: FLKR.mesh.shadowParams
  });

  using model = FLKR.mesh.model;

  mat4.translate(model, model, FLKR.state.position);
  mat4.rotateY(model, model, Math.PI);
  mat4.scale(model, model, [ 3,3,3 ]);

  scene.add(FLKR.mesh);
  scene.add(SPEAR.mesh);

  scene.onpass.add(() => {

    const time = scene.renderer.info.currentFrame / 100 % (Math.PI * 2);

    for ( const [ model, index ] of SPEAR.mesh.writeModels() ) {

      const q = quat.create();
      const r = (Math.PI * 2) / SPEAR.mesh.instances * index + time;

      quat.rotateX(q, q, -Math.PI / 2);
      mat4.fromRotationTranslation(model, q, vec3.add(
        [0,0,0], 
        FLKR.state.position, 
        [
            0 + 4 * Math.cos(r),
            2 + 4 * Math.sin(r),
            0,
          ]
      ));
  
    }

    using model = FLKR.mesh.model;

    vec3.add(FLKR.state.position, FLKR.state.anchor, [
      0,
      Math.pow(Math.sin(scene.renderer.info.currentFrame / 150) * 1, 2),
      0,
    ])

    mat4.identity(model)
    mat4.translate(model, model, FLKR.state.position);
    mat4.rotateY(model, model, Math.PI);
    mat4.scale(model, model, [ 1.5,1.5,1.5 ]);

  });

}