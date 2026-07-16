# madge-config-nick2bad4u

[![Continuous Integration](https://github.com/Nick2bad4u/madge-config-nick2bad4u/actions/workflows/ci.yml/badge.svg)](https://github.com/Nick2bad4u/madge-config-nick2bad4u/actions/workflows/ci.yml)

Shared Madge dependency-analysis configuration for Nick2bad4u TypeScript and npm repositories.

The package fixes the source config's ignored Graphviz block by publishing `graphVizOptions` at Madge's required top level. It also includes a cross-platform wrapper because Madge 8 has no `--config` option.

## Install

```sh
npm install --save-dev madge madge-config-nick2bad4u
```

## Recommended usage

```json
{
 "scripts": {
  "madge:circular": "madge-nick2bad4u --circular --no-spinner ./src",
  "madge:orphans": "madge-nick2bad4u --orphans --no-spinner ./src"
 }
}
```

The wrapper sets Madge's supported `madge_config` environment variable to the bundled `.madgerc`, then invokes the consumer-installed Madge CLI. Relative values such as `baseDir` and `tsConfig` continue to resolve from the consumer working directory.

### Runtime-only dependencies

The opt-in `runtime` preset excludes shallow npm packages and ignores TypeScript `import type` edges. This is useful when the question is what loads at runtime rather than what participates in the complete source graph:

```json
{
 "scripts": {
  "madge:runtime": "madge-nick2bad4u --preset runtime --json ./src"
 }
}
```

The wrapper consumes `--preset runtime` (or `--preset=runtime`) before forwarding all other arguments to Madge. The default preset is unchanged and continues to include npm and type-only dependencies.

Direct filesystem usage is also supported:

```sh
cross-env madge_config=node_modules/madge-config-nick2bad4u/.madgerc madge --circular ./src
cross-env madge_config=node_modules/madge-config-nick2bad4u/presets/runtime.madgerc madge --json ./src
```

Programmatic consumers can select the same presets through the typed root API:

```js
import {
 createMadgePreset,
 loadMadgeConfig,
 madgeConfigPaths,
 madgeRuntimeConfig,
} from "madge-config-nick2bad4u";

const runtime = createMadgePreset("runtime", {
 graphVizOptions: { G: { rankdir: "TB" } },
});

const runtimeFromDisk = await loadMadgeConfig("runtime");
console.log(
 madgeConfigPaths.runtime,
 madgeRuntimeConfig,
 runtime,
 runtimeFromDisk
);
```

Arrays supplied to `createMadgeConfig` or `createMadgePreset` replace shared arrays. Known nested `detectiveOptions` and `graphVizOptions` entries are merged two levels deep without mutating either package preset. Invalid nested option shapes are rejected instead of silently ignored.

## Notes

- Pass `--ts-config` when the consumer does not use `./tsconfig.json`.
- `includeNpm` remains enabled to preserve the existing dependency-graph policy.
- Madge 8 reads only the `G`, `E`, and `N` sections under `graphVizOptions`; the bundled presets keep graph, edge, and node attributes in those supported sections.
- Graph images request the Inter font, but Graphviz will substitute another font when it is unavailable.
- Madge 8 currently declares an optional TypeScript 5 peer range. TypeScript 6 consumers may need `npm install --force` until Madge widens that upstream range.

## Validation

```sh
npm run release:verify
```

Tests validate the config shape, override behavior, corrected Graphviz placement, and a real circular-dependency run through the packaged wrapper.
