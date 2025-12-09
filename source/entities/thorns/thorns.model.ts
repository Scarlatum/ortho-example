import { mat4, quat, vec3 } from "gl-matrix";
import { Creation, Renderer } from "ortho";
import { Model } from "ortho/source/utils/model.utils";
import { phyQueue } from "~/main";
import BasicScene from "~/scenes/cyber.scene";
import { EntityType } from "~/workers/phy.shared";
import { ThornsWTO } from "./thorns.shared";
import { InstancedMesh } from "ortho/source/mesh/mesh.model";
import { LightCascade } from "ortho/source/renderer/light/light.model";

type ThornsPayload = {
  outPositions: Array<vec3>;
  pickedPositions: Array<vec3>;
};

function getPositions(
  vertexes  : Float32Array,
  model     : Float32Array,
  payload   : ThornsPayload,
  lim       : number,
) {

  const skip = 6;

  vertexLoop: for (let i = 0; i < vertexes.length; i += 3 * skip) {

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
  sym: symbol,
  data: ArrayBuffer, 
  scene: BasicScene,
  payload: ThornsPayload
) {

  let terrainMesh = scene.meshes.get("terrain")!;

  const vertexes = terrainMesh.data.vertexes.deref();

  if ( !vertexes ) throw Error("Terrain vertexes already removed by GC");

  {

    const model = terrainMesh instanceof InstancedMesh 
      ? terrainMesh.models[0] 
      : terrainMesh.model
      ;

    getPositions(vertexes, model, payload, 300);

    scene.meshes.delete("terrain");

  }

  const entity = await Creation.create(sym, {
    geometry: Renderer.dec.decode(data),
    textures: null,
  }, scene.renderer.materials.repo.get(1)!, {
    instaces: payload.outPositions.length,
    shadow: {
      cascade: LightCascade.Close | LightCascade.Near | LightCascade.Far,
    },
    state: payload.outPositions.map(pos => ({
      pos: pos,
      rot: quat.create(),
    }))
  });

  const wto: ThornsWTO = {
    collisionBoxes: Array<Float32Array>(entity.mesh.instances)
  }

  for (const [ model, index ] of entity.mesh.writeModels()) {

    const { pos, rot } = entity.state[index];
    
    quat.rotateX(rot, rot, Math.random() * 0.25);
    quat.rotateZ(rot, rot, Math.random() * 0.25);

    mat4.fromRotationTranslationScale(model, rot, pos, [
      0.1,
      20 + 10 * Math.random(),
      0.1,
    ])

    const transformedBox = entity.mesh.edges.map(x => vec3.transformMat4([0,0,0], x, model));

    wto.collisionBoxes[index] = new Float32Array(transformedBox.flat(2) as number[]);

  }

  phyQueue.add({
    type: EntityType.Thorns,
    payload: wto
  });

  scene.onpass.add(() => {

    const camera = scene.camera;

    for ( var i = 0; i < payload.outPositions.length; i++ ) {

      const current = payload.outPositions[i];

      entity.mesh.visibilityIndexes[i] = Number(camera.onFront([ current ]));

    }

    entity.mesh.updateVisibilityBuffer();

  });

  scene.add(entity.mesh);

}