import { ColliderDesc, RigidBodyDesc, World } from "@dimforge/rapier3d-compat";
import { PillarsWTO } from "./pilars.shared";

export default function(
  world   : World,
  payload : PillarsWTO,
) {

  const groupFlag = 0b0000_0000_0000_1000_0000_0000_0000_0001;

  for ( const box of payload.collisionBoxes ) {

    const body = RigidBodyDesc.fixed();
    const desc = ColliderDesc.convexMesh(box);

    if ( !desc ) throw Error();

    desc.setDensity(10);
  
    const collider = world.createCollider(desc, world.createRigidBody(body));
  
    collider.setCollisionGroups(groupFlag);
    collider.setSolverGroups(groupFlag);

  }

}