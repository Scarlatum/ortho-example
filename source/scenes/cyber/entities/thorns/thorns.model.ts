import { mat4, quat, vec3 } from "gl-matrix";
import { Creation, Renderer } from "ortho";
import { Model } from "ortho/source/utils/model.utils";
import BasicScene from "~/scenes/cyber/cyber.scene";

type ThornsPayload = {
  outPositions: Array<vec3>;
  pickedPositions: Array<vec3>;
};

function getPositions(
  vertexes  : Float32Array,
  model     : Model,
  payload   : ThornsPayload,
  lim       : number,
) {

  vertexLoop: for (let i = 0; i < vertexes.length; i += 3) {

    if ( payload.outPositions.length >= lim ) break;

    const current = vec3.transformMat4([ 0, 0, 0 ], [
      vertexes[ i + 0 ],
      vertexes[ i + 1 ],
      vertexes[ i + 2 ],
    ], model);

    for ( let i = 0; i < payload.outPositions.length; i++ ) {

      const dist = vec3.dist(payload.outPositions[i], current);

      if ( dist < 20 ) continue vertexLoop;

    }

    for ( let i = 0; i < payload.pickedPositions.length; i++ ) {

      const pos = payload.pickedPositions[i];

      if ( current[0] === pos[0] || current[1] === pos[1] || current[2] === pos[2] ) continue vertexLoop;

    }

    payload.outPositions.push(current);

  }

}

export default async function(
  data: ArrayBuffer, 
  scene: BasicScene,
  payload: ThornsPayload
) {

  const terrain = scene.meshes.get("terrain")!;

  const vertexes = terrain.data.vertexes.deref();

  if ( !vertexes ) throw Error("Terrain vertexes already removed by GC");

  getPositions(vertexes, terrain.model, payload, 30);

  const entity = await Creation.create({
    geometry: Renderer.dec.decode(data),
    textures: null,
  }, scene.renderer.materials.repo.get(1)!, {
    cast: true,
    recieve: false,
  }, payload.outPositions.length, payload.outPositions.map(pos => ({
    pos: pos,
    rot: quat.create(),
  })));

  for (const [ model, index ] of entity.mesh.writeModels()) {

    const { pos, rot } = entity.state![index];
    
    quat.rotateX(rot, rot, Math.random() * 0.25);
    quat.rotateZ(rot, rot, Math.random() * 0.25);

    mat4.fromRotationTranslationScale(model, rot, pos, [
      0.1,
      20 + 10 * Math.random(),
      0.1,
    ])

  }

  scene.onpass.add(() => {

    const cam   = scene.actor.camera.position;

    for ( var i = 0; i < payload.outPositions.length; i++ ) {

      const current = payload.outPositions[i];

      const vis = scene.actor.camera.onFront([ current ])
          && vec3.distance(cam, current) < 300 

      entity.mesh.visibilityIndexes[i] = Number(vis);

    }

  });

  scene.drawQueue.add(entity.mesh);


}