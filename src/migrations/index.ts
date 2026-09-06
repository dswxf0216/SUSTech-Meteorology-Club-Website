import * as migration_20260903_030305_initial from './20260903_030305_initial';
import * as migration_20260903_123514_daily_forecasts from './20260903_123514_daily_forecasts';
import * as migration_20260904_072246_editor_approval from './20260904_072246_editor_approval';
import * as migration_20260905_120000_forecast_editor_fields from './20260905_120000_forecast_editor_fields';
import * as migration_20260905_170000_forecast_precipitation_fields from './20260905_170000_forecast_precipitation_fields';
import * as migration_20260905_210000_forecast_image_capture from './20260905_210000_forecast_image_capture';
import * as migration_20260905_223000_forecast_rainfall_range from './20260905_223000_forecast_rainfall_range';
import * as migration_20260906_100000_three_day_forecast_dates from './20260906_100000_three_day_forecast_dates';
import * as migration_20260906_180000_temperature_text from './20260906_180000_temperature_text';

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
  {
    up: migration_20260905_170000_forecast_precipitation_fields.up,
    down: migration_20260905_170000_forecast_precipitation_fields.down,
    name: '20260905_170000_forecast_precipitation_fields',
  },
  {
    up: migration_20260905_210000_forecast_image_capture.up,
    down: migration_20260905_210000_forecast_image_capture.down,
    name: '20260905_210000_forecast_image_capture',
  },
  {
    up: migration_20260905_223000_forecast_rainfall_range.up,
    down: migration_20260905_223000_forecast_rainfall_range.down,
    name: '20260905_223000_forecast_rainfall_range',
  },
  {
    up: migration_20260906_100000_three_day_forecast_dates.up,
    down: migration_20260906_100000_three_day_forecast_dates.down,
    name: '20260906_100000_three_day_forecast_dates',
  },
  {
    up: migration_20260906_180000_temperature_text.up,
    down: migration_20260906_180000_temperature_text.down,
    name: '20260906_180000_temperature_text',
  },
];
