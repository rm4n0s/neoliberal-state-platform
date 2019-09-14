# Neoliberal State Platform

## Introduction

The concept of the project was to create a state that prints money and taxes transactions.
The project is a prototype and was just a hobby to understand how to use Nest.js, Angular 8 and Stellar SDK.
Currently the project has been discontinued.

## How it works

The server is the state that handles an account on Stellar and from this account the server can print its currency as assets.  
Administrators of the server can create accounts that will represent public services.  
These public services will send money to deposits of the recipients.  
Deposits are temporary and created to accumulate money from one or more transactions.  
A user can create a deposit by creating a SHA256 hash keeping the digested as a secret and gives the hash to anyone who wants to transfer money to the user.  
When the user’s deposit receive some money, then the user can withdraw the money to his/her own accounts on Stellar.  
On the withdraw of the money, from the deposit, the user specifies the separation of the amount into accounts by giving a master public key for each account with the secret of the hash to authorize the transaction.  
Then the server creates the accounts and put the master public key of the user to the accounts, so the user be able to use them.  
Also, if a tax has submitted to the system by an admin then on withdraw the state will accumulate the taxes.

## How the UI works

Read the GUIDE.md from the folder doc/

## Installation

The project created on node.js 12v, MariaDB, podman and tested on Stellar’s test network.
Here are the steps:

- Download client’s dependencies  
  $ cd client  
  $ npm install  
  \$ ng build

- Start DB  
  $ cd ..  
  $ bash executables/start-db-container.sh

- Start the server  
  $ npm install  
  $ npm run start

## Configurations

The configuration file needs to be in the same folder where the server is running and needs to have the name app.config.json.  
To configure the server first you need to create Stellar accounts from where the server will print the currency and for the administrators that will be able to add taxes and create accounts for public services.  
These attributes are :

- publicKey: The public key of the account that will print money
- privateKey: The secret of the account that will print money
- listAdmins: The list of admins based on the public key of their accounts.

In the configurations has an attribute called “currencyUnits” where you can add units for your new currency. For example if you want to add 1 euro, then you can add it in the list as ‘1euro’ or just ‘1’ . You can have one or even more currency units where the number in the name of the asset will count in the total amount. For that reason the name of the unit should not include the letter ‘c’ because it multiplies the number to 0.01. For example c50 counts as 0.5 . But even if you use only one currency, lets say 1euro then you can transfer 0.5 of its value like you would with 1 ‘c50’

Other configuration attributes for the Stellar:

- limitLumens: The number of lumens that the state can transfer to public services
- baseFeeMultiplier: The number that will multiply with the base fee to create the fee for each stellar transaction
- enoughLumenForAssetAccount: The number of lumen that the state will include to each account that it creates from withdraws.
- isTest: The attribute that specifies if it will use the Stellar’s test network or the public network.
- horizonUrl: The URL that will use for all the Stellar’s transactions
- stellarTimeout: The timeout on how long it will wait for a stellar transaction to finish, in milliseconds.

Server configurations:

- port: The port that the server will use.
- dbOptions: The options for the MySQL based on the configurations it asked from the Typeorm library.

## Known Issues

- SHA256 is not good for hiding passwords
- There is not any HTTPS implemented
- No unit testing, only integration tests for very basic tests
- The owner of accounts can bypass the state by exchanging between them the assets. However this can be fixed by making the state owner of the accounts by having equal rights with the user of the accounts and prevent the user to do any transactions other than the state.
- Stellar times out when the fee is not enough or it thinks that the server is DDOSing the blockchain.
- Withdraws and payments are slow to submit because of the time it takes to submit them on stellar.
- It has support only for English language on the DB
- The client saves the private accounts in the local storage of the browser unprotected and does not have a way for the user to download them.
- The controller for withdrawing money should use FRP and not async-mutex.

## FAQ

- Why call it Neoliberal State Platform ?  
  Because the idea is to have a free market economy with a small state that taxes transactions only with a flat tax
- Why use Stellar ?  
  Because it is easier than other blockchains and the blockchain nodes are not controlled by any state keeping the transactions safe.
- Why Nest.JS and Angular ?  
  Because they are written in Typescript and they are here for creating enterprise software.
