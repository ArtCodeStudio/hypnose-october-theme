// iMPORTANT do not use .babelrc: https://github.com/babel/babel/issues/8711#issuecomment-421918023
module.exports = {
  "presets": [
    [
      "@babel/typescript", {
        "allExtensions": true
      }
    ],
    [
      "@babel/preset-env", {
        corejs: 3,
        useBuiltIns: "entry",
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime", {
        "corejs": 3
      }
    ],
    "@babel/plugin-syntax-export-default-from",
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    "array-includes"
  ],
  "ignore": [
    "**/custom-elements-es5-adapter.js"
  ]
};
