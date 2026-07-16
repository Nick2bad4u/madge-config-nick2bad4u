# Repository Instructions

This repository publishes `madge-config-nick2bad4u`.
Treat `.madgerc`, the `madge-nick2bad4u` binary, and the typed root export as public package surfaces.

## Priorities

- Keep `graphVizOptions` at the config root; Madge ignores it under `detectiveOptions`.
- Preserve consumer-working-directory resolution for `baseDir` and `tsConfig`.
- Test the wrapper against a real graph because Madge has no supported `--config` flag.
- Keep generated output, dependency folders, build artifacts, and reports out of commits.
- Do not weaken security or release gates to make CI pass.

## Commands

```sh
npm run build:runtime
npm run typecheck
npm test
npm run release:verify
```
