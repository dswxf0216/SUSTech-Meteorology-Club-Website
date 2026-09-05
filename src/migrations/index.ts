import * as migration_20260903_030305_initial from './20260903_030305_initial';
import * as migration_20260903_123514_daily_forecasts from './20260903_123514_daily_forecasts';
import * as migration_20260904_072246_editor_approval from './20260904_072246_editor_approval';
import * as migration_20260905_120000_forecast_editor_fields from './20260905_120000_forecast_editor_fields';

export const migrations = [
  {
    up: migration_20260903_030305_initial.up,
    down: migration_20260903_030305_initial.down,
    name: '20260903_030305_initial',
  },
  {
    up: migration_20260903_123514_daily_forecasts.up,
    down: migration_20260903_123514_daily_forecasts.down,
    name: '20260903_123514_daily_forecasts',
  },
  {
    up: migration_20260904_072246_editor_approval.up,
    down: migration_20260904_072246_editor_approval.down,
    name: '20260904_072246_editor_approval'
  },
  {
    up: migration_20260905_120000_forecast_editor_fields.up,
    down: migration_20260905_120000_forecast_editor_fields.down,
    name: '20260905_120000_forecast_editor_fields',
  },
];
