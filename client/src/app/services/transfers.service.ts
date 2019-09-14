import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { v4 as uuid } from 'uuid';
import { Keypair } from 'stellar-sdk';
import {
  PaginationI,
  ListPaginatedI,
} from '../interfaces/pagination.interface';
import {
  InputTransfer,
  OutputTransfer,
  InputDataTransfer,
} from '../interfaces/transfer.interface';
import { AmountI } from '../interfaces/amount.interface';

class TransferSecretError extends Error {
  constructor(message?: string) {
    super(message);
    this.message = `Transfer error with 'secret': ${this.message}`;
  }
}

class TransferSignatureError extends Error {
  constructor(message?: string) {
    super(message);
    this.message = `Transfer error with 'signature': ${this.message}`;
  }
}

@Injectable({
  providedIn: 'root',
})
export class TransfersService {
  constructor(private http: HttpClient) {}

  createTransfer(
    masterSecret: string,
    receiver: string,
    includeLumens: string,
    reason: string,
    amounts: AmountI[],
    source: 'printer' | 'taxes',
  ) {
    let requesterPair: Keypair;
    try {
      requesterPair = Keypair.fromSecret(masterSecret);
    } catch (e) {
      throw new TransferSecretError('The secret is not correct.');
    }
    const data: InputDataTransfer = {
      includeLumens,
      nonce: uuid(),
      reason,
      receiver,
      source,
      requester: requesterPair.publicKey(),
      amounts,
    };
    const stringifiedData = JSON.stringify(data);
    const input: InputTransfer = {
      data,
      stringifiedData,
      signature: '',
    };
    try {
      input.signature = requesterPair
        .sign(Buffer.from(stringifiedData))
        .toString('base64');
    } catch (e) {
      throw new TransferSignatureError('Failed to sign the input.');
    }
    return this.http.post<OutputTransfer>('/api/transfers', input);
  }

  getTransfers(pag: PaginationI) {
    return this.http.get<ListPaginatedI<OutputTransfer>>(
      `/api/transfers?page=${pag.page}&size=${pag.size}`,
    );
  }

  getTransfersByAccount(pag: PaginationI, address: string) {
    return this.http.get<ListPaginatedI<OutputTransfer>>(
      `/api/accounts/${address}/transfers?page=${pag.page}&size=${pag.size}`,
    );
  }
}
