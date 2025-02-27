import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";

import { Phy } from "~/workers/phy.shared";
import { ThornsWTO } from "./thorns.shared";

export default function(
  { world, queue }: Phy,
  payload : ThornsWTO,
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