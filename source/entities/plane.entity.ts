import { mat4, vec3 } from "gl-matrix";
import { Renderer } from "ortho";
import { Creation } from "ortho/source/entity/creation.entity";
import { SceneInterface } from "ortho/source/interfaces/scene.interface";
import { Wave } from "ortho/source/mesh/parsers/waveform";

interface TerrainChunkState {
  name: string
}

declare global {
  var out: HTMLElement
}

export async function plane(data: ArrayBuffer, scene: SceneInterface) {

  const objects = Wave.parseTextFileCombined(Renderer.dec.decode(data));

  const chunks = new Set<Creation<TerrainChunkState, number>>();

  for ( const x of objects ) {
  
    const entity = await Creation.create(Symbol(),
      {
        geometry: x,
        textures: null,
      }, 
      scene.renderer.materials.repo.get(1)!, 
      {
        state: {
          name: `${ chunks.size % 4 }::${ Math.floor(chunks.size / 4) }`
        } satisfies TerrainChunkState
      }
    );

    using model = entity.mesh.model;
    const box = entity.mesh.box;

    mat4.translate(model, model, [ 0, -80, 0 ]);
    mat4.scale(model, model, [
      500,
      500,
      500,
    ]);
    
    vec3.transformMat4(box.a, box.a, model);
    vec3.transformMat4(box.b, box.b, model);

    scene.add(entity.mesh);

    chunks.add(entity);

  }

  scene.onpass.add(() => {
    for ( const x of chunks ) {
      x.mesh.drop = !scene.camera.onFront(x.mesh.edges);
    }
  })

}
