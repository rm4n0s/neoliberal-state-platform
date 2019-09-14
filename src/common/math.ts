import { BigNumber } from 'bignumber.js';

export function assetToNumber(asset: string): string {
  // tslint:disable-next-line:radix
  const an = parseInt(asset);
  let res = `${an}`;
  if (asset.includes('c')) {
    const assetWithoutC = asset.replace('c', '');
    // tslint:disable-next-line:radix
    const an2 = parseInt(assetWithoutC);
    const num = `${an2}`;
    res = new BigNumber('0.01').multipliedBy(num).toString();
  }
  return res;
}

export function addAssetToTotal(asset: string, total: string): string {
  const num = assetToNumber(asset);
  return new BigNumber(num).plus(total).toString();
}

export function multipleAssetToValue(asset: string, value: string): string {
  const num = assetToNumber(asset);
  return new BigNumber(num).multipliedBy(value).toString();
}
