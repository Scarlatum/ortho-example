
import "./surface.setup";

import { Renderer } from "ortho/source/renderer/renderer.model"
import BaseScene from "./scenes/base.scene"

declare const surface: HTMLCanvasElement;

const [ _adapter, device, context ] = await Renderer.getSetup(surface);

const renderer = new Renderer(device, context);
const scene = new BaseScene(renderer);

await scene.setupScene();

renderer.addScene(scene);
renderer.render(null);