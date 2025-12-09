import { mat4, quat, vec3 } from "gl-matrix";
import { Creation, Renderer } from "ortho";
import { phyQueue } from "~/main";

import makePlane from "ortho/source/mesh/builders/plane.builder";

import BasicScene from "~/scenes/cyber.scene";
import { EntityType } from "~/workers/phy.shared";
import { PillarsWTO } from "./pilars.shared";
import { TextureContainer } from "ortho/source/entity/creation.entity";

export default async function(
  scene: BasicScene, 
  sym: symbol, 
  mesh: ArrayBuffer,
  textures: TextureContainer,
) {

  const pillarSideSize = 30;
  const q = quat.identity([0,0,0,0]);

  const pillar = await Creation.create(sym, {
    geometry: Renderer.dec.decode(mesh),
    textures: null,
  }, scene.renderer.materials.repo.get(1)!, {
    instaces: 10,
    state: Array.from({ length: 10 }, () => {

      const x = -500 + 1000 * Math.random();
      const z = -500 + 1000 * Math.random();
  
      const pos = [ x, 0, z ] as vec3;
      const scl = [ pillarSideSize, 100 + 500 * Math.random(), pillarSideSize ] as vec3;
      const mdl = mat4.fromRotationTranslationScale(mat4.create(), q, pos, scl);
  
      return Object.seal({
        rot: q, 
        pos: pos,
        scl: scl,
        mdl: mdl,
      });
  
    })
  });

  {

    const wto: PillarsWTO = {
      collisionBoxes: Array<Float32Array>(pillar.mesh.instances)
    }
  
    for (const [ model, i ] of pillar.mesh.writeModels()) {
  
      const state = pillar.state![i];
  
      model.set(state.mdl);
  
      const transformedBox = pillar.mesh.edges.map(x => vec3.transformMat4([0,0,0], x, model));
  
      wto.collisionBoxes[i] = new Float32Array(transformedBox.flat(2) as number[]);
  
    }

    phyQueue.add({
      type: EntityType.Pillars,
      payload: wto
    });
  
    scene.onpass.add(() => {
  
      const camera = scene.camera;
  
      for ( var i = 0; i < pillar.state.length; i++ ) {
  
        const current = pillar.mesh.edges.map(x => {
          return vec3.transformMat4([0,0,0], x, pillar.state[i].mdl);
        });

        const visible = camera.onFront(current);
        
        pillar.mesh.visibilityIndexes[i] = Number(visible);
        
      }

      pillar.mesh.updateVisibilityBuffer();

    });

  }

  if ( true ) { // Display

    const width = pillarSideSize - 5.0;

    // const light = new PointLight();

    const entity = await Creation.create(Symbol("plane mesh"), {
      geometry: makePlane(),
      textures,
    }, scene.renderer.materials.repo.get(0)!, {
      shadow: { cast: false, recieve: false }
    });

    using model = entity.mesh.model;

    const [ closestPillar ] = pillar.state!.toSorted((a,b) => {
      return vec3.dist(a.pos, [0,0,0]) - vec3.dist(b.pos, [0,0,0]);
    });

    closestPillar.pos[0] -= pillarSideSize + 0.25;
    closestPillar.pos[1] += 75.0;

    const rot = quat.create();

    const { height: texHeight, width: texWidth } = textures.diffuse[0];

    quat.fromEuler(rot, 90, 90, 180);
    mat4.fromRotationTranslationScale(
      model, 
      rot, 
      closestPillar.pos, 
      [
          width,
          1,
          width * texHeight / texWidth
        ]
    );

    scene.add(entity.mesh);

  }

  scene.add(pillar.mesh);

}
