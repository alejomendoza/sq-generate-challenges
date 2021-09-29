import {
  BASE_FEE,
  Networks,
  Keypair,
  Transaction,
  TransactionBuilder,
  Account,
  Operation
} from "stellar-base";
import axios from "axios";
import { getLobbyId } from "./set-clues";

const fs = require("fs");
const accounts = require("../accounts.json");

const sourceKeys = Keypair.fromSecret(
  "SC7ZFX5MHGYTKI4UX6IQWTESOYNZ7MPJDF4DO2HNLXVNP3AD6UBUGVUK"
);

const HORIZON_URL = "https://horizon-testnet.stellar.org";

const generateMultipleKeys = () =>
  Array.from({ length: 19 }, () => Keypair.random());

const processTransaction = async (
  horizonUrl: string,
  transaction: Transaction
) => {
  const xdr = transaction.toXDR();

  return axios
    .post(`${horizonUrl}/transactions?tx=${encodeURIComponent(xdr)}`)
    .then(({ data }) => data)
    .catch((error) => error.response.data);
};

async function createNewAccounts() {
  let account = await axios
    .get(
      `https://horizon-testnet.stellar.org/accounts/${sourceKeys.publicKey()}`
    )
    .then(({ data }) => data);

  let transaction = new TransactionBuilder(
    new Account(account.id, account.sequence),
    {
      fee: BASE_FEE,
      networkPassphrase: Networks["TESTNET"]
    }
  );

  const newAccounts = generateMultipleKeys();
  const newAccountKeys = newAccounts.map((account) => ({
    publicKey: account.publicKey(),
    secretKey: account.secret()
  }));

  for (const account of newAccounts) {
    const newPublicKey = account.publicKey();

    transaction
      .addOperation(
        Operation.beginSponsoringFutureReserves({
          sponsoredId: newPublicKey
        })
      )
      .addOperation(
        Operation.createAccount({
          destination: newPublicKey,
          startingBalance: "0"
        })
      )
      .addOperation(
        Operation.endSponsoringFutureReserves({
          source: newPublicKey
        })
      );
  }

  const builtTransaction = transaction.setTimeout(30).build();
  builtTransaction.sign(sourceKeys, ...newAccounts);

  await processTransaction(HORIZON_URL, builtTransaction);

  return newAccountKeys;
}

if (!accounts || !(accounts.length && accounts.length > 0)) {
  createNewAccounts().then((accountKeys) => {
    fs.writeFileSync(
      "accounts.json",
      JSON.stringify(accountKeys, null, 2),
      () => {}
    );
  });
}

getLobbyId().then((data) => console.log(data));
