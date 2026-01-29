export default {
  '*.{ts,tsx}': ['eslint --fix --ignore-pattern packages/storybook', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
};
