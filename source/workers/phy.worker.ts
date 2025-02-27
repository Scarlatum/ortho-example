import { init } from "@dimforge/rapier3d-compat";
import { Phy } from "./phy.shared";

await init();

let instance: Phy;

postMessage({ spec: "ready" });

addEventListener("message", event => {

  if ( import.meta.env.DEV ) console.debug(event, instance);

  if ( event.data.spec === "preparations" ) {

    const { position, direction } = event.data.payload;

    instance = new Phy(position, direction);

    postMessage({ spec: "preparations", payload: instance.point });

  }

  if ( event.data instanceof Set ) instance!.process(event.data);

})