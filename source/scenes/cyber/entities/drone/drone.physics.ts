import { ColliderDesc, RigidBodyDesc, World,  } from "@dimforge/rapier3d-compat";
import { DroneWTO } from "./drone.shared";

export function drone(
  world: World,
  queue: Set<Function>,
  payload: DroneWTO,
) {

  const body = RigidBodyDesc.fixed();

  const collider = world.createCollider(
    ColliderDesc.cuboid(payload.width, payload.height, payload.width), 
    world.createRigidBody(body)
  );

  collider.setMass(700);
  collider.setCollisionGroups(0x000F000F);
  collider.setSolverGroups(0x000F000F);

  let controller = world.createCharacterController(0.25);

  const prevpos = new Float32Array(payload.pos.length);
  const nextpos = new Float32Array(payload.pos.length);

  queue.add(() => {

    controller.computeColliderMovement(collider, {
      x: payload.vec[0],
      y: payload.vec[1],
      z: payload.vec[2],
    });

    nextpos.set(payload.pos);

    // const collisionCount = controller.numComputedCollisions();

    // if ( !collisionCount ) nextpos.set(payload.pos);

    // else for (let i = 0; i < controller.numComputedCollisions(); i++) {

    //   let collision = controller.computedCollision(i);

    //   if ( collision ) {

    //     payload.vec.fill(0);

    //     nextpos.set(prevpos);

    //   }

    // }

    prevpos.set(payload.pos);

    collider.setTranslation({
      x: nextpos[0],
      y: nextpos[1],
      z: nextpos[2],
    });

  });

}