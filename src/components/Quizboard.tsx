import { useState, Dispatch, SetStateAction } from "react";
import { TezosToolkit, WalletContract } from "@taquito/taquito";
import { QuizboardProps, StorageData } from "../types";

const Quizboard = ({
  contract,
  setUserBalance,
  Tezos,
  userAddress,
  setStorage,
}: QuizboardProps) => {
  const [loadingYes, setLoadingYes] = useState<boolean>(false);
  const [loadingNo, setLoadingNo] = useState<boolean>(false);

  const voteYes = async (): Promise<void> => {
    setLoadingYes(true);
    try {
      const op = await contract.methods.increment(1).send();
      console.log("[DEBUG]:", op);
      await op.confirmation();
      const newStorage: any = await contract.storage();
      let mydata: StorageData = {
        admin: newStorage.admin,
        askAmt: newStorage.askAmt.toNumber(),
        questions: newStorage.questions,
        voters: newStorage.voters,
        voteAmt: newStorage.voteAmt.toNumber(),
      };
      setStorage(mydata);
      setUserBalance(await Tezos.tz.getBalance(userAddress));
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingYes(false);
    }
  };

  const voteNo = async (): Promise<void> => {
    setLoadingNo(true);
    try {
      const op = await contract.methods.decrement(1).send();
      await op.confirmation();
      const newStorage: any = await contract.storage();
      let mydata: StorageData = {
        admin: newStorage.admin,
        askAmt: newStorage.askAmt.toNumber(),
        questions: newStorage.questions,
        voters: newStorage.voters,
        voteAmt: newStorage.voteAmt.toNumber(),
      };
      setStorage(mydata);
      setUserBalance(await Tezos.tz.getBalance(userAddress));
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingNo(false);
    }
  };

  if (!contract && !userAddress) return <div>&nbsp;</div>;
  return (
    <div className="buttons">
      <button
        className="button"
        disabled={loadingYes || loadingNo}
        onClick={voteYes}
      >
        {loadingYes ? (
          <span>
            <i className="fas fa-spinner fa-spin"></i>&nbsp; Please wait
          </span>
        ) : (
          <span>
            <i className="fas fa-check"></i>&nbsp; Yes
          </span>
        )}
      </button>
      <button
        className="button"
        disabled={loadingNo || loadingYes}
        onClick={voteNo}
      >
        {loadingNo ? (
          <span>
            <i className="fas fa-spinner fa-spin"></i>&nbsp; Please wait
          </span>
        ) : (
          <span>
            <i className="fas fa-times"></i>&nbsp; No
          </span>
        )}
      </button>
    </div>
  );
};

export default Quizboard;
