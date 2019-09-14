import { HttpException, HttpStatus } from '@nestjs/common';

export const ERROR_SIGNATURE_IS_EMPTY = new HttpException(
  'Signature is empty',
  HttpStatus.UNAUTHORIZED,
);

export const ERROR_RECEIVER_IS_EMPTY = new HttpException(
  'Receiver is empty',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_REQUESTER_IS_EMPTY = new HttpException(
  'Requester is empty',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_REASON_IS_EMPTY = new HttpException(
  'Reason is empty',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_NONCE_IS_EMPTY = new HttpException(
  'Nonce is empty',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_AMOUNT_IS_EMPTY = new HttpException(
  'Amount is empty',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_STRINGIFIED_DATA_IS_EMPTY = new HttpException(
  'Stringified data is empty',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_SIGNATURE_DOES_NOT_VERIFY = new HttpException(
  'The signature does not verify the input.',
  HttpStatus.UNAUTHORIZED,
);

export const ERROR_STRINGIFIED_DATA_IS_NOT_EQUAL_TO_DATA = new HttpException(
  // tslint:disable-next-line:quotemark
  "The stringified data is not equal to input's data.",
  HttpStatus.UNAUTHORIZED,
);

export const ERROR_REQUESTER_NOT_IN_ADMINS = new HttpException(
  'The requester is not in the list of admins',
  HttpStatus.UNAUTHORIZED,
);

export const ERROR_RECEIVER_NOT_IN_ACCOUNTS = new HttpException(
  'The receiver is not in the list of accounts',
  HttpStatus.UNAUTHORIZED,
);

export const ERROR_ASSET_NAME_DOES_NOT_EXISTS = new HttpException(
  'An asset name in the list of ammounts does not exist in the configurations.',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_AMOUNT_CAN_NOT_BE_EQUAL_OR_LESS_THAN_ZERO = new HttpException(
  'An amount is equal or less than zero.',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_INCLUDED_LUMENS_ARE_OVER_THE_LIMIT = new HttpException(
  'Included lumens are over the limit',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const FAILED_TO_SAVE_THE_TRANSFER_IN_DB = new HttpException(
  'Failed to save the transfer in the DB',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FAILED_TO_SAVE_THE_ACCOUNT_IN_DB = new HttpException(
  'Failed to save the account in the DB',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const ERROR_TRANSFER_NOT_FOUND = new HttpException(
  'The transfer not found',
  HttpStatus.NOT_FOUND,
);

export const ERROR_TAX_REVENUE_NOT_ENOUGH_FOR_THE_TRANSFER = new HttpException(
  'The amount is less than the tax revenue',
  HttpStatus.UNAUTHORIZED,
);

export const ERROR_ACCOUNT_NOT_FOUND = new HttpException(
  'The account not found',
  HttpStatus.NOT_FOUND,
);

export const ERROR_NAME_IS_EMPTY = new HttpException(
  'Name is empty',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_MASTER_KEY_IS_EMPTY = new HttpException(
  'Master key is empty',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_THE_SIGNATURE_ALREADY_EXISTS = new HttpException(
  'The signature already exists',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const FAILED_TO_CREATE_ACCOUNT_ON_STELLAR = new HttpException(
  'Failed to create account on stellar.',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FAILED_TO_TRUST_ASSET_ON_STELLAR = new HttpException(
  'Failed to trust asset on stellar.',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FAILED_TO_CHANGE_MASTER_KEY_ON_STELLAR = new HttpException(
  'Failed to change master key on stellar.',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FAILED_THE_TRANSACTION_ON_STELLAR = new HttpException(
  'Failed the transaction on stellar',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FAILED_TO_ADD_DEPOSIT = new HttpException(
  'Failed to add deposit in the DB',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FAILED_TO_ADD_DEPOSIT_EXISTS_ALREADY = new HttpException(
  'Failed to add deposit in the DB, because it already exists',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FAILED_TO_EDIT_DEPOSIT = new HttpException(
  'Failed to edit deposit in the DB',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const ERROR_DEPOSIT_NOT_FOUND = new HttpException(
  'The deposit not found',
  HttpStatus.NOT_FOUND,
);

export const FAILED_TO_SAVE_THE_TRANSACTION_IN_DB = new HttpException(
  'Failed to save the transaction in the DB',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FAILED_TO_ADD_TAX_IN_DB = new HttpException(
  'Failed to add the tax in the DB',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FAILED_EDIT_TAX_IN_DB = new HttpException(
  'Failed to edit the tax in the DB',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const ERROR_TAX_NOT_FOUND = new HttpException(
  'The tax not found',
  HttpStatus.NOT_FOUND,
);

export const FAILED_TO_SAVE_THE_WITHDRAW_IN_DB = new HttpException(
  'Failed to save the withdraw in the DB',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const ERROR_FAILED_TO_ADD_STATE_IN_DB = new HttpException(
  'Failed to save the state in the DB',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const ERROR_MISSING_STATE_IN_DB = new HttpException(
  'Missing the state from the DB',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const ERROR_THE_PASSWORD_IS_NOT_CORRECT = new HttpException(
  'The password is not correct',
  HttpStatus.UNAUTHORIZED,
);

export const ERROR_MASTER_KEY_IS_NOT_CORRECT_LENGTH = new HttpException(
  'The master key is not correct length of 56 characters',
  HttpStatus.UNAUTHORIZED,
);

export const ERROR_DEPOSIT_HASH_IS_EMPTY = new HttpException(
  'Deposit hash is empty',
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const ERROR_AMOUNT_NOT_EQUAL_THE_DEPOSIT_AMOUNT = new HttpException(
  "The amount is not equal to the deposit's amount ",
  HttpStatus.UNAUTHORIZED,
);
