/* eslint-disable tree-shaking/no-side-effects-in-initialization */

export default {
  input: "src/index.js",
  external: ["sinon"],
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
    },
    {
      file: "dist/index.esm.js",
      format: "es",
    },
  ],
};
