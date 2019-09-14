import { createAction, props } from '@ngrx/store';

export const reloadTaxRevenueAction = createAction(
  'RELOAD_TAX_REVENUE',
  props<{ taxRevenue: string }>(),
);
