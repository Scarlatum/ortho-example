import { Collider, ColliderDesc, RigidBodyDesc, World } from "@dimforge/rapier3d-compat";
import { CONTAINER_QUANTITY, CONTAINER_SIZE } from "./container.shared";

export default function(
  world: World, 
  queue: Set<Function>,
  buffer: Float32Array,
) {

  const colliders = Array<Collider>(CONTAINER_QUANTITY);

  for ( let i = 0; i < CONTAINER_QUANTITY; i++ ) {

    const body = world.createRigidBody(RigidBodyDesc.dynamic());
  
    body.setTranslation({
      x: Math.random() * 500 - 250, 
      y: 50, 
      z: Math.random() * 500 - 250,
    }, true);
  
    const collider = world.createCollider(ColliderDesc.cuboid(...CONTAINER_SIZE), body);
  
    collider.setFriction(0.5);
    collider.setMass(1500);
    collider.setCollisionGroups(0b0000_0000_0000_1111_0000_0000_0000_1111);
    collider.setSolverGroups(0b0000_0000_0000_1111_0000_0000_0000_1111);

    colliders[i] = collider;

  }

  queue.add(() => {

    for ( let i = 0; i < CONTAINER_QUANTITY; i++ ) {

      const pos = colliders[i].translation();
      const rot = colliders[i].rotation();

      const data = [
        rot.x, rot.y, rot.z, rot.w,
        pos.x, pos.y, pos.z
      ];
  
      buffer.set(data, data.length * i);

    }

  })

}