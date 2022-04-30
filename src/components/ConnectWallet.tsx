import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { TezosToolkit, MichelsonMap } from "@taquito/taquito";
import { BigNumber } from "bignumber.js";
import { BeaconWallet } from "@taquito/beacon-wallet";
import {
  NetworkType,
  BeaconEvent,
  defaultEventCallbacks,
} from "@airgap/beacon-sdk";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import { LedgerSigner } from "@taquito/ledger-signer";
import { StorageData, ButtonProps } from "../types";

const ConnectButton = ({
  Tezos,
  setContract,
  setWallet,
  setUserAddress,
  setUserBalance,
  setStorage,
  contractAddress,
  setBeaconConnection,
  setPublicToken,
  wallet,
  rpcUrl,
}: ButtonProps): JSX.Element => {
  const [loadingNano, setLoadingNano] = useState<boolean>(false);

  const setup = async (userAddress: string): Promise<void> => {
    setUserAddress(userAddress);
    // updates balance
    const balance = await Tezos.tz.getBalance(userAddress);
    setUserBalance(balance.toNumber());
    // creates contract instance
    const contract = await Tezos.wallet.at(contractAddress);
    const storage: any = await contract.storage();
    setContract(contract);
    let mydata: StorageData = {
      admin: storage.admin,
      askAmt: storage.askAmt.toNumber(),
      questions: storage.questions,
      voters: storage.voters,
      voteAmt: storage.voteAmt.toNumber(),
    };
    console.log("[DEB]:", storage, typeof storage);
    // for voters
    // let votees = new Map();
    // mydata.voters.forEach((val: any, key: any) => {
    //   votees.set(key, new Set(val));
    // });
    // console.log(votees.get("1"));

    // for questions
    // let foreachPairs = new Map();
    // mydata.questions.forEach((val: any, key: any) => {
    //   foreachPairs.set(key, [val[0].toNumber(), val[1]]);
    // });
    setStorage(mydata);
  };

  const connectWallet = async (): Promise<void> => {
    try {
      await wallet.requestPermissions({
        network: {
          type: NetworkType.CUSTOM,
          rpcUrl: rpcUrl,
        },
      });
      // gets user's address
      const userAddress = await wallet.getPKH();
      await setup(userAddress);
      setBeaconConnection(true);
    } catch (error) {
      console.log(error);
    }
  };

  const connectNano = async (): Promise<void> => {
    try {
      setLoadingNano(true);
      const transport = await TransportU2F.create();
      const ledgerSigner = new LedgerSigner(transport, "44'/1729'/0'/0'", true);
      Tezos.setSignerProvider(ledgerSigner);
      //Get the public key and the public key hash from the Ledger
      const userAddress = await Tezos.signer.publicKeyHash();
      await setup(userAddress);
    } catch (error) {
      console.log("Error!", error);
      setLoadingNano(false);
    }
  };

  useEffect(() => {
    (async () => {
      // creates a wallet instance
      const wallet = new BeaconWallet({
        name: "Taquito Boilerplate",
        preferredNetwork: NetworkType.CUSTOM,
        disableDefaultEvents: true, // Disable all events / UI. This also disables the pairing alert.
        eventHandlers: {
          // To keep the pairing alert, we have to add the following default event handlers back
          [BeaconEvent.PAIR_INIT]: {
            handler: defaultEventCallbacks.PAIR_INIT,
          },
          [BeaconEvent.PAIR_SUCCESS]: {
            handler: (data) => setPublicToken(data.publicKey),
          },
        },
      });
      Tezos.setWalletProvider(wallet);
      setWallet(wallet);
      // checks if wallet was connected before
      const activeAccount = await wallet.client.getActiveAccount();
      if (activeAccount) {
        const userAddress = await wallet.getPKH();
        await setup(userAddress);
        setBeaconConnection(true);
      }
    })();
  }, []);

  return (
    <div className="buttons">
      <button className="button" onClick={connectWallet}>
        <span>
          <i className="fas fa-wallet"></i>&nbsp; Connect with wallet
        </span>
      </button>
      <button className="button" disabled={loadingNano} onClick={connectNano}>
        {loadingNano ? (
          <span>
            <i className="fas fa-spinner fa-spin"></i>&nbsp; Loading, please
            wait
          </span>
        ) : (
          <span>
            <i className="fab fa-usb"></i>&nbsp; Connect with Ledger Nano
          </span>
        )}
      </button>
    </div>
  );
};

export default ConnectButton;
