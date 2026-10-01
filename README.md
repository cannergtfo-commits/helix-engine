# Helix

Helix is a browser game engine: a scene editor, a WebGL renderer, a component model, and a playable runtime. Scenes are JSON. The same document you edit is the document you simulate.

[Watch the 10-second demo](demo/helix-demo.mp4) — the brick cottage and the warden, from the live scene.

One hundred and thirty-five texture packets ship with the studio, including a dark-fantasy elven set: moonstone, nightwood, dusk velvet, silverleaf, and violet glass. `helix.textures()` lists them. The Moon court places five elves — Vaelith, Seryne, Ilyra, Nimrael, and Orinel — in front of a moonstone hall.

## Editor

Open the app and use the courtyard demo.

- **Play** simulates. **Stop** restores the scene to the moment you pressed Play.
- **W** drives the rover, **A** turns left, **D** turns right, **S** brakes. Heading is rotation Y. `0` faces world −Z.
- **W / E / R** switch move, rotate, and scale while editing. **F** frames the selection.
- Add a mesh, a collider, and a rigidbody to make a dynamic object.
- Behaviors: `spin`, `bob`, `orbit`, `player`, and `custom`.
- Export downloads a `.helix.json` file. Import loads one. The scene also autosaves in the browser.

Custom scripts run in the page and receive one argument, `api`:

```js
api.rotate(0, 40 * api.dt, 0);
api.translate(0, 0, -2 * api.dt);
api.setColor("#c9863a");
```

`api.dt` is seconds. `api.time` is seconds since play started. `rotate` is degrees.

## Code

The runtime lives in `src/engine`.

```ts
import { HelixEngine, createStarterScene } from "./src/engine";

const engine = new HelixEngine(canvas, hooks);
engine.apply(createStarterScene());
engine.setMode("play");
engine.start();
```

A scene is version `1` JSON: gravity, fog, and entities with transform plus components (`mesh`, `light`, `camera`, `collider`, `rigidbody`, `script`).

The viewport keeps the dark brass stage and draws it with an Unreal-style bloom pass, a dusk image-based light, soft shadows, and tiled finishes for brick, wood, stone, glass, and the lot. Materials stay on the document; the renderer only samples them.

Helix keeps the world in a document the renderer only draws. Agents build houses with `helix.build([...])` — rooms, walls, doors, windows, roofs, and furniture — without clicking. A batch commits once, or rolls back on collision. `helix.world()` is the room tree, `helix.validate()` lists overlaps and missing doors, and `helix.benchmark()` constructs a cottage headlessly and checks that the same plan hashes the same twice.

Helix is a studio for chain games. Stamp a gate, loot drop, currency purse, vendor, or skin. Play checks the studio wallet and never sends a transaction. Bots do the same with `helix.run([{ op: "rule", role: "gate", token: "KEY", x: 0, z: -3 }, { op: "grant", token: "KEY" }])`. `helix.scene()` returns each entity's rule and the wallet. A real contract can be passed as `contract`, `standard`, and `chain` instead of a sample symbol.

Bots build through `window.helix` on the studio page. `helix.catalog()`, `helix.find("knight")`, and `helix.scene()` are the reads. `helix.run([{ op: "place", id: "gate", asset: "knight", x: 2, z: -2 }])` is the write. The same contract is at `/agent/schema.json`. A same-origin frame can post `{ type: "helix.run", id, commands }` and listen for `{ type: "helix.result" }`. Ground, camera, and lights stay. One batch is one undo step.

Helix is directed by Grok. In the library, describe a scene and press Direct this scene. The call runs on the server, places models from the CC0 catalog, and writes the story beats and concept. The warden, ground, and lights stay so the result is playable. Box, sphere, and the other primitives are tucked under Add → Shapes.

Helix 0.3 adds a CC0 model shelf. The files in `public/library` are AI-assisted game models published under CC0 1.0 by their contributors on [3dassets.dev](https://3dassets.dev). They are public domain: use them in a game, change them, ship them. No attribution is required. Drag a model from Library onto the floor, or use Add. A model keeps its materials; the primitive color does not tint it.

The files here are the engine and the editor. `src/routes` and `src/router.tsx` are the host integration: they import the application shell, so they compile inside the Helix app rather than as a bare package. Extend `src/engine` and `src/editor` to keep shipping it.

Helix 0.1 is a shippable editor and runtime, not a finished Unity or Unreal replacement. Nested hierarchy, an asset pipeline, animation clips, and a packaged player build are the next layers. The scene document is version 1, so later versions can load scenes saved now.

