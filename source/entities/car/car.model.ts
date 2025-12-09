import { mat4, vec3 } from "gl-matrix";
import { Creation, TextureContainer } from "ortho/source/entity/creation.entity";
import { PointLight } from "ortho/source/renderer/light/point.model";
import { Renderer } from "ortho/source/renderer/renderer.model";
import { createPhyBuffer } from "~/main";

import BasicScene from "~/scenes/cyber.scene";
import { CarPhyBufferSize, CarWTO } from "./car.shared";
import { EntityType } from "~/workers/phy.shared";
import { DirectionLight } from "ortho";

export async function cars(
  scene: BasicScene,
  sym: symbol, 
  res: ArrayBuffer,
  textures: Nullable<TextureContainer> = null, 
) {

  { // Static

    let li = 1.0;

    const lr = new PointLight();
    const ll = new PointLight();

    ll.visible  = lr.visible  = true;
    ll.color    = lr.color		= [1.0,0.5,0.0];

    const entity = await Creation.create(sym, {
      geometry: Renderer.dec.decode(res),
      textures,
    }, scene.renderer.materials.repo.get(1)!, {
      instaces: 1,
      shadow: { cast: true, recieve: true }
    });

    const vertexes = entity.mesh.data.vertexes.deref();

    if ( !vertexes ) throw Error();

    const phyView = createPhyBuffer(EntityType.Cars, CarPhyBufferSize, {
      box: new Float32Array(entity.mesh.edges.flat() as number[])
    } satisfies CarWTO);

    scene.onpass.add(() => {

      using model = entity.mesh.model;

      li = Math.sin(scene.renderer.info.currentFrame / 30) * 0.5 + 0.5;

      const q = phyView.subarray(0,4);
      const v = phyView.subarray(4,7);

      const rl = vec3.transformQuat([0,0,0], [ +1.0, -0.35, -3.2 ], q);
      const rr = vec3.transformQuat([0,0,0], [ -1.0, -0.35, -3.2 ], q);

      lr.position = vec3.sub([0,0,0], v, rr);
      ll.position = vec3.sub([0,0,0], v, rl);

      lr.range = ll.range = li * 0.5;

      mat4.fromRotationTranslationScale(model, 
        q, 
        v, 
        [ 1, 1, 1 ]
      );
      
    })

    scene.add(entity.mesh);

  }

  { // Dyn

    const amount = 20;

    const entity = await Creation.create(sym, {
      geometry: Renderer.dec.decode(res),
      textures,
    }, scene.renderer.materials.repo.get(1)!, {
      instaces: amount,
      state: Array.from({ length: amount }, () => {

        const row = Math.floor(4 * Math.random());
        const col = Math.floor(4 * Math.random());
  
        return {
          row,
          col,
          speed: (1.0 + row * Math.random()) * -1 * 0.25
        };
  
      }) 
    });

    const baseAlt = 110;

    for (const [ model, index ] of entity.mesh.writeModels()) {
      mat4.translate(model, model, [
        entity.state[ index ].col * 10,
        baseAlt + entity.state[ index ].row * 10,
        200 * Math.random(),
      ]);
    }

    scene.onpass.add(() => {

      for (const [ model, index ] of entity.mesh.writeModels()) {

        const isTurnPoint = Math.abs(model[ 14 ]) >= 500;

        if (isTurnPoint) {
          mat4.rotateY(model, model, 0.01);
        }

        mat4.translate(model, model, [
          0,
          0,
          entity.state[ index ].speed,
        ]);

        const current = entity.mesh.edges.map(x => {
          return vec3.transformMat4([0,0,0], x, model);
        });

        const visible = scene.camera.onFront(current);
        
        entity.mesh.visibilityIndexes[index] = Number(visible);

      }

      entity.mesh.updateVisibilityBuffer();

    });

    scene.add(entity.mesh);

  }

}