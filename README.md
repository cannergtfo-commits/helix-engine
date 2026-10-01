# Helix

Helix is a browser game engine: a scene editor, a WebGL renderer, a component model, and a playable runtime. Scenes are JSON. The same document you edit is the document you simulate.

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

Helix 0.3 adds a CC0 model shelf. The files in `public/library` are AI-assisted game models published under CC0 1.0 by their contributors on [3dassets.dev](https://3dassets.dev). They are public domain: use them in a game, change them, ship them. No attribution is required. Drag a model from Library onto the floor, or use Add. A model keeps its materials; the primitive color does not tint it.

The files here are the engine and the editor. `src/routes` and `src/router.tsx` are the host integration: they import the application shell, so they compile inside the Helix app rather than as a bare package. Extend `src/engine` and `src/editor` to keep shipping it.

Helix 0.1 is a shippable editor and runtime, not a finished Unity or Unreal replacement. Nested hierarchy, an asset pipeline, animation clips, and a packaged player build are the next layers. The scene document is version 1, so later versions can load scenes saved now.

