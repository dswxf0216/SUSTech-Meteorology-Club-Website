import * as migration_20260903_030305_initial from './20260903_030305_initial';
import * as migration_20260903_123514_daily_forecasts from './20260903_123514_daily_forecasts';

export const migrations = [
  {
    up: migration_20260903_030305_initial.up,
    down: migration_20260903_030305_initial.down,
    name: '20260903_030305_initial',
  },
  {
    up: migration_20260903_123514_daily_forecasts.up,
    down: migration_20260903_123514_daily_forecasts.down,
    name: '20260903_123514_daily_forecasts'
  },
];
