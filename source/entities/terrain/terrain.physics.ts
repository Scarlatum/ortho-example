import { ColliderDesc, RigidBodyDesc, TriMeshFlags, World } from "@dimforge/rapier3d-compat";
import { TerrainWTO } from "./terrain.shared";
import { vec3 } from "gl-matrix";
import { Phy } from "~/workers/phy.shared";

export function terrain(
  { world, queue }: Phy,
  { vertexes, model }: TerrainWTO,
) {

  const v = new Float32Array(vertexes.length);
  const abobas = new Uint32Array(Array.from({ length: vertexes.length / 3 }, (_,i) => i));

  for ( var i = 0; i < vertexes.length; i += 3 ) {

    v.set(vec3.transformMat4([0,0,0], [
      vertexes[i + 0],
      vertexes[i + 1],
      vertexes[i + 2],
    ], model), i);

  }

  const body = RigidBodyDesc.fixed();

  const collider = world.createCollider(
    ColliderDesc.trimesh(v, abobas, TriMeshFlags.DELETE_BAD_TOPOLOGY_TRIANGLES)!, 
    world.createRigidBody(body)
  );

  const groupFlag = 0b0000_0000_0000_0111_0000_0000_0000_1110;

  collider.setCollisionGroups(groupFlag);
  collider.setSolverGroups(groupFlag);
  collider.setFriction(0.025);

}