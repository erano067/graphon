export default {
  '*.{ts,tsx}': [
    'eslint --fix --ignore-pattern packages/storybook',
    'prettier --write',
    () => 'pnpm typecheck',
    () => 'pnpm test:coverage',
  ],
  '*.{json,md}': ['prettier --write'],
};
