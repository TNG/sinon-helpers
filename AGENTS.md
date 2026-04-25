# Agent Instructions

## Commands

```bash
npm test        # build (rollup) then run mocha tests — always run both together
npm run build   # rollup build only: src/index.js -> dist/index.js + dist/index.esm.js
npm run lint    # eslint --fix on *.js, src/**/*.js, test/**/*.js
```

`npm test` runs `npm run build` first; tests import from `dist/`, not `src/`.

## Structure

- `src/index.js` — library entry point
- `src/constructors.js` — core implementation
- `test/index.spec.js` — single test file (mocha + chai)
- `dist/` — built output (CJS + ESM), committed to repo and published via `files`

## Conventions

- Commit messages must follow **Angular convention** (enforced by commitlint + husky).  
  Examples: `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`
- Pre-commit hook runs `lint-staged` (eslint --fix).
- `sinon` is a peer dependency — do not add it to `dependencies`.
- Releases are automated via `semantic-release`; do not bump `version` in `package.json` manually (it is `0.0.0-development`).
