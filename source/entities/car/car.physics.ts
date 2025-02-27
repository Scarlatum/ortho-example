import { ColliderDesc, RigidBodyDesc, World } from "@dimforge/rapier3d-compat";
import { CarWTO } from "./car.shared";
import { Phy } from "~/workers/phy.shared";

export function cars(
  { world, queue }: Phy,
  buffer: Float32Array,
  payload: CarWTO,
) {

  const body = RigidBodyDesc.dynamic();

  const collider = world.createCollider(
    ColliderDesc.convexMesh(payload.box)!, 
    world.createRigidBody(body)
  );

  const groupFlag = 0b0000_0000_0000_1111_0000_0000_0000_1111;

  collider.setMass(700);
  collider.setCollisionGroups(groupFlag);
  collider.setSolverGroups(groupFlag);

  queue.add(() => {

    const pos = collider.translation();
    const rot = collider.rotation();

    buffer.set([
      rot.x,
      rot.y,
      rot.z,
      rot.w,
      pos.x,
      pos.y,
      pos.z
    ]);

  })

}