// eslint-disable-next-line tree-shaking/no-side-effects-in-initialization
module.exports = {
  extends: ["plugin:prettier/recommended"],
  plugins: ["tree-shaking"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "tree-shaking/no-side-effects-in-initialization": 2,
  },
};
