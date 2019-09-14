import * as TaxRevenueActions from '../actions/tax.revenue.action';
import { createReducer, on, Action } from '@ngrx/store';
export interface State {
  taxRevenue: string;
}

export const initialState: State = {
  taxRevenue: '0',
};

const privTaxRevenueReducer = createReducer(
  initialState,
  on(TaxRevenueActions.reloadTaxRevenueAction, (state, { taxRevenue }) => ({
    taxRevenue,
  })),
);

export function taxRevenueReducer(state: State | undefined, action: Action) {
  return privTaxRevenueReducer(state, action);
}
