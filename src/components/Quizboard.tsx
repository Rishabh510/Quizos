import { useState, Dispatch, SetStateAction } from "react";
import { MichelsonMap, TezosToolkit, WalletContract } from "@taquito/taquito";
import { QuizboardProps, StorageData } from "../types";
import { Line } from "rc-progress";

const Quizboard = ({
  contract,
  setUserBalance,
  Tezos,
  userAddress,
  setStorage,
  storage,
}: QuizboardProps) => {
  const [loadingYes, setLoadingYes] = useState<boolean>(false);
  const [loadingNo, setLoadingNo] = useState<boolean>(false);

  const voteYes = async (qId: number): Promise<void> => {
    setLoadingYes(true);
    setLoadingNo(true);
    try {
      const op = await contract.methods.add_vote(true, qId).send({ amount: 1 });
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
      setLoadingNo(false);
    }
  };

  const voteNo = async (qId: number): Promise<void> => {
    setLoadingYes(true);
    setLoadingNo(true);
    try {
      const op = await contract.methods
        .add_vote(false, qId)
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
      setLoadingYes(false);
      setLoadingNo(false);
    }
  };

  function renderQuizboard(
    questions: MichelsonMap<any, any>,
    voters: MichelsonMap<any, any>
  ) {
    let foreachPairs: any[] = [];
    questions.forEach((val: any, key: any) => {
      let votes: any = { true: 0, false: 0 };
      let done = false;
      if (voters.has(key)) {
        let temp = voters.get(key);
        for (let x of temp) {
          done = done || userAddress === x[0];
          votes[x[1]]++;
        }
      }
      // qId, prizePool, question, alreadyVoted, votesForQuestion
      foreachPairs.push([key, val[0].toNumber(), val[1], done, votes]);
    });

    return (
      <div>
        {foreachPairs.map((ele) => {
          return (
            <div key={ele[0]}>
              <div className="question">
                <span>{`Q${ele[0]}. ${ele[2]}`}</span>
                <span>{`Prize Pool: ${ele[1] / 1000000} ꜩ`}</span>
              </div>
              {voters.has(ele[0].toString()) ? (
                <Line
                  percent={
                    (ele[4]["true"] * 100) / (ele[4]["true"] + ele[4]["false"])
                  }
                  strokeWidth={1}
                  trailWidth={1}
                  strokeColor="green"
                  trailColor="red"
                />
              ) : (
                <h3>No votes yet. Be the first to vote!</h3>
              )}
              <div className="buttons">
                <button
                  className="button"
                  disabled={loadingYes || loadingNo || ele[3]}
                  onClick={() => voteYes(ele[0])}
                >
                  {loadingYes ? (
                    <span>
                      <i className="fas fa-spinner fa-spin"></i>&nbsp; Please
                      wait
                    </span>
                  ) : (
                    <span>
                      <i className="fas fa-check"></i>&nbsp;Yes&nbsp;(
                      {ele[4]["true"]} votes)
                    </span>
                  )}
                </button>
                <button
                  className="button"
                  disabled={loadingNo || loadingYes || ele[3]}
                  onClick={() => voteNo(ele[0])}
                >
                  {loadingNo ? (
                    <span>
                      <i className="fas fa-spinner fa-spin"></i>&nbsp; Please
                      wait
                    </span>
                  ) : (
                    <span>
                      <i className="fas fa-times"></i>&nbsp;No&nbsp;(
                      {ele[4]["false"]} votes)
                    </span>
                  )}
                </button>
              </div>
              <hr />
            </div>
          );
        })}
      </div>
    );
  }

  if (!contract && !userAddress) return <div>&nbsp;</div>;
  return renderQuizboard(storage.questions, storage.voters);
};;

export default Quizboard;
