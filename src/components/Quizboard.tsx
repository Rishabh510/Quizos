import { useState, Dispatch, SetStateAction } from "react";
import { TezosToolkit, WalletContract } from "@taquito/taquito";
import { QuizboardProps, StorageData } from "../types";
import { CONTRACT } from "../constants";

const Quizboard = ({
  contract,
  setUserBalance,
  Tezos,
  userAddress,
  setStorage,
}: QuizboardProps) => {
  const [loadingYes, setLoadingYes] = useState<boolean>(false);
  const [loadingNo, setLoadingNo] = useState<boolean>(false);

  const voteYes = async (qId: number): Promise<void> => {
    setLoadingYes(true);
    try {
      const op = await contract.methods.add_vote(true, qId).send({ amount: 1 });
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

  const voteNo = async (qId: number): Promise<void> => {
    setLoadingNo(true);
    try {
      const op = await contract.methods
        .add_vote(false, qId, 1)
        .send({ amount: 1 });
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
        onClick={() => voteYes(1)}
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
        onClick={() => voteNo(1)}
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
