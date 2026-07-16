# Shared Config Maintenance Checklist

## Public Surface

- [ ] Review every bundled config, typed export, binary, and package subpath.
- [ ] Keep consumer-owned paths, repository identity, credentials, and output policy out of shared defaults.
- [ ] Update README installation, usage, variants, compatibility notes, and migration guidance.
- [ ] Update package metadata, peer ranges, `exports`, and `files`.
- [ ] Confirm package-owned assets are present in `npm pack --dry-run`.
- [ ] Install the packed tarball in a temporary consumer and run the real upstream tool.

## Toolchain

- [ ] Keep `.node-version`, `.nvmrc`, `engines.node`, and `packageManager` aligned.
- [ ] Run `npm run sync:node-version-files:check`.
- [ ] Run `npm run update-deps` only after reviewing peer compatibility.
- [ ] Validate shared ESLint, Prettier, package JSON, Remark, Secretlint, Gitleaks, Yamllint, TSDoc, and TypeDoc integration.
- [ ] Run `npm run lint:actions` after workflow changes.

## Verification

- [ ] Run `npm run build:runtime`.
- [ ] Run `npm run typecheck`.
- [ ] Run focused tests, then `npm run test:coverage`.
- [ ] Run the package's native config/consumer smoke test.
- [ ] Run `npm run release:verify`.
- [ ] Inspect the full diff for copied identities, stale paths, generated artifacts, and unexpected package contents.

## Before Release

- [ ] Confirm the release is compatible with the documented peer ranges.
- [ ] Confirm CI passes at the release commit on all supported operating systems.
- [ ] Confirm npm trusted publishing and provenance remain configured without a long-lived token fallback.
- [ ] Preview the changelog and choose semver from the public behavior change.
