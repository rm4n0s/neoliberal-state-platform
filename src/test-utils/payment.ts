import * as StellarSdk from 'stellar-sdk';
import { AmountI } from '../interfaces/amount.interface';

export async function stellarPayment(
  accPub: string,
  secret: string,
  destination: string,
  amounts: AmountI[],
  memo: string,
) {
  // tslint:disable-next-line:no-console
  console.log('From public key:', accPub);
  // tslint:disable-next-line:no-console
  console.log('With secret:', secret);
  // tslint:disable-next-line:no-console
  console.log('Sends to :', destination);
  // tslint:disable-next-line:no-console
  console.log('The amounts:', amounts);
  // tslint:disable-next-line:no-console
  console.log('With memo:', memo);
  const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
  const fee = await server.fetchBaseFee();
  const account = await server.loadAccount(accPub);

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: 10 * fee,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  });
  for (const amount of amounts) {
    const asset = new StellarSdk.Asset(amount.assetName, destination);
    transaction.addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset,
        amount: amount.amountNumber,
      }),
    );
  }
  const transactionBuilder = transaction
    .addMemo(StellarSdk.Memo.hash(memo))
    .setTimeout(300)
    .build();

  // sign the transaction
  transactionBuilder.sign(StellarSdk.Keypair.fromSecret(secret));

  try {
    const transactionResult = await server.submitTransaction(
      transactionBuilder,
    );
    // tslint:disable-next-line:no-console
    console.log(transactionResult);
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.error(err);
  }
}
