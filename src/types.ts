import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { TezosToolkit, MichelsonMap, WalletContract } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { BigNumber } from "bignumber.js";

export type StorageData = {
  admin: string;
  askAmt: BigNumber;
  questions: MichelsonMap<string, any>;
  voters: MichelsonMap<string, any>;
  voteAmt: BigNumber;
};

export type ButtonProps = {
  Tezos: TezosToolkit;
  setContract: Dispatch<SetStateAction<any>>;
  setWallet: Dispatch<SetStateAction<any>>;
  setUserAddress: Dispatch<SetStateAction<string>>;
  setUserBalance: Dispatch<SetStateAction<number>>;
  setStorage: Dispatch<SetStateAction<StorageData>>;
  contractAddress: string;
  setBeaconConnection: Dispatch<SetStateAction<boolean>>;
  setPublicToken: Dispatch<SetStateAction<string | null>>;
  wallet: BeaconWallet;
  rpcUrl: string;
};

export interface QuizboardProps {
  contract: WalletContract | any;
  setUserBalance: Dispatch<SetStateAction<any>>;
  Tezos: TezosToolkit;
  userAddress: string;
  setStorage: Dispatch<SetStateAction<StorageData>>;
  storage: any;
}
