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

Direct filesystem usage is also supported:

```sh
cross-env madge_config=node_modules/madge-config-nick2bad4u/.madgerc madge --circular ./src
```

Programmatic consumers can import `madgeConfig`, `madgeConfigPath`, `loadMadgeConfig()`, or `createMadgeConfig(overrides)` from `madge-config-nick2bad4u`.

Arrays supplied to `createMadgeConfig` replace shared arrays; nested objects are merged without mutating the package default.

## Notes

- Pass `--ts-config` when the consumer does not use `./tsconfig.json`.
- `includeNpm` remains enabled to preserve the existing dependency-graph policy.
- Graph images request the Inter font, but Graphviz will substitute another font when it is unavailable.
- Madge 8 currently declares an optional TypeScript 5 peer range. TypeScript 6 consumers may need `npm install --force` until Madge widens that upstream range.

## Validation

```sh
npm run release:verify
```

Tests validate the config shape, override behavior, corrected Graphviz placement, and a real circular-dependency run through the packaged wrapper.
