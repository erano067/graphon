import type { Preview } from '@storybook/react-vite';
import PhysicsWorker from '../src/physics.worker?worker';

export const createPhysicsWorker = (): Worker => new (PhysicsWorker as new () => Worker)();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        dark: { name: 'dark', value: '#1a1a2e' },
        light: { name: 'light', value: '#ffffff' },
        navy: { name: 'navy', value: '#0f0f23' },
      },
    },
    layout: 'fullscreen',
  },

  initialGlobals: {
    backgrounds: {
      value: 'dark',
    },
  },

  beforeEach: () => {
    return () => {};
  },

  argTypesEnhancers: [
    (context) => {
      if (context.argTypes.createWorkerFn) {
        context.argTypes.createWorkerFn.table = { disable: true };
      }
      return context.argTypes;
    },
  ],

  args: {
    createWorkerFn: createPhysicsWorker,
  },
};

export default preview;
