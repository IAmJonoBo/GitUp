# Release GitUp

Use this guide to package and release the VS Code extension.

## Local release

1. Run the release script: `./tools/release.sh`
2. Find the VSIX in `packages/extension/`.

## GitHub release

1. Update the version in `packages/extension/package.json`.
2. Tag the release: `git tag vX.Y.Z`.
3. Push the tag: `git push origin vX.Y.Z`.

The release workflow packages the VSIX and publishes a GitHub release.
