import * as migration_20260903_030305_initial from './20260903_030305_initial';

export const migrations = [
  {
    up: migration_20260903_030305_initial.up,
    down: migration_20260903_030305_initial.down,
    name: '20260903_030305_initial'
  },
];
