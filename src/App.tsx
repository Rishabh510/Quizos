import { useState } from "react";
import { MichelsonMap, TezosToolkit } from "@taquito/taquito";
import "./App.css";
import { BigNumber } from "bignumber.js";
import { NETWORK, RPC_URL, CONTRACT_ADDRESS, CONTRACT } from "./constants";
import ConnectButton from "./components/ConnectWallet";
import DisconnectButton from "./components/DisconnectWallet";
import Transfers from "./components/Transfers";
import qrcode from "qrcode-generator";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Quizboard from "./components/Quizboard";
import { StorageData } from "./types";
import { Line } from "rc-progress";

enum BeaconConnection {
  NONE = "",
  LISTENING = "Listening to P2P channel",
  CONNECTED = "Channel connected",
  PERMISSION_REQUEST_SENT = "Permission request sent, waiting for response",
  PERMISSION_REQUEST_SUCCESS = "Wallet is connected",
}

const App = () => {
  const [Tezos, setTezos] = useState<TezosToolkit>(new TezosToolkit(RPC_URL));
  const [contract, setContract] = useState<any>(undefined);
  const [publicToken, setPublicToken] = useState<string | null>("");
  const [wallet, setWallet] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [storage, setStorage] = useState<any>();
  const [copiedPublicToken, setCopiedPublicToken] = useState<boolean>(false);
  const [beaconConnection, setBeaconConnection] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("contract");

  const contractAddress: string = CONTRACT;

  const generateQrCode = (): { __html: string } => {
    const qr = qrcode(0, "L");
    qr.addData(publicToken || "");
    qr.make();
    return { __html: qr.createImgTag(4) };
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
      foreachPairs.push([key, val[0].toNumber(), val[1], done, votes]);
    });

    return (
      <div>
        {foreachPairs.map((ele) => {
          return (
            <div key={ele[0]}>
              <p>{`Q${ele[0]}. ${ele[2]}`}</p>
              <h5>{`Prize Pool: ${ele[1] / 1000000} ꜩ`}</h5>
              {voters.has(ele[0].toString()) ? (
                <span>
                  <b>{`Yes (${ele[4]["true"]})`}</b>
                  <button disabled={ele[3]}>TEST</button>
                  <b>{`No (${ele[4]["false"]})`}</b>
                  <Line
                    percent={
                      (ele[4]["true"] * 100) /
                      (ele[4]["true"] + ele[4]["false"])
                    }
                    strokeWidth={2}
                    trailWidth={2}
                    strokeColor="green"
                    trailColor="red"
                  />
                </span>
              ) : (
                <h5>No voters</h5>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (publicToken && (!userAddress || isNaN(userBalance))) {
    return (
      <div className="main-box">
        <Header />
        <div id="dialog">
          <header>Answer Yes/No questions & win crypto!</header>
          <div id="content">
            <p className="text-align-center">
              <i className="fas fa-broadcast-tower"></i>&nbsp; Connecting to
              your wallet
            </p>
            <div
              dangerouslySetInnerHTML={generateQrCode()}
              className="text-align-center"
            ></div>
            <p id="public-token">
              {copiedPublicToken ? (
                <span id="public-token-copy__copied">
                  <i className="far fa-thumbs-up"></i>
                </span>
              ) : (
                <span
                  id="public-token-copy"
                  onClick={() => {
                    if (publicToken) {
                      navigator.clipboard.writeText(publicToken);
                      setCopiedPublicToken(true);
                      setTimeout(() => setCopiedPublicToken(false), 2000);
                    }
                  }}
                >
                  <i className="far fa-copy"></i>
                </span>
              )}

              <span>
                Public token: <span>{publicToken}</span>
              </span>
            </p>
            <p className="text-align-center">
              Status: {beaconConnection ? "Connected" : "Disconnected"}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  } else if (userAddress && !isNaN(userBalance)) {
    return (
      <div className="main-box">
        <Header />
        <div id="tabs">
          <div
            id="transfer"
            className={activeTab === "transfer" ? "active" : ""}
            onClick={() => setActiveTab("transfer")}
          >
            Manage account
          </div>
          <div
            id="contract"
            className={activeTab === "contract" ? "active" : ""}
            onClick={() => setActiveTab("contract")}
          >
            Quiz Board
          </div>
        </div>
        <div id="dialog">
          <div id="content">
            {activeTab === "transfer" ? (
              <div id="transfers">
                <h3 className="text-align-center">Manage Account</h3>
                <Transfers
                  Tezos={Tezos}
                  userBalance={userBalance}
                  setUserBalance={setUserBalance}
                  userAddress={userAddress}
                />
                <p>
                  <i className="fas fa-file-code"></i>&nbsp;
                  <a
                    href={`https://better-call.dev/${NETWORK}/${contractAddress}/operations`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {contractAddress}
                  </a>
                </p>
                <p>
                  <i className="fas fa-user"></i>&nbsp; {userAddress}
                </p>
                <p>
                  <i className="fas fa-wallet"></i>&nbsp;
                  {(userBalance / 1000000).toLocaleString("en-US")} ꜩ
                </p>
                <DisconnectButton
                  wallet={wallet}
                  rpcUrl={RPC_URL}
                  setPublicToken={setPublicToken}
                  setUserAddress={setUserAddress}
                  setUserBalance={setUserBalance}
                  setWallet={setWallet}
                  setTezos={setTezos}
                  setBeaconConnection={setBeaconConnection}
                />
              </div>
            ) : (
              <div id="increment-decrement">
                <h3 className="text-align-center">
                  {storage &&
                    renderQuizboard(storage.questions, storage.voters)}
                </h3>
                <Quizboard
                  contract={contract}
                  setUserBalance={setUserBalance}
                  Tezos={Tezos}
                  userAddress={userAddress}
                  setStorage={setStorage}
                />
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  } else if (!publicToken && !userAddress && !userBalance) {
    return (
      <div className="main-box">
        <div className="title">
          <Header />
        </div>
        <div id="dialog">
          <header>Answer Yes/No questions & win crypto!</header>
          <div id="content">
            <p>Rules!</p>
            <p>
              <li>Only Admin can post question for 10 Tez.</li>
              <li>
                Participants can vote Yes/No (only once for a particular
                question) for 1 Tez which will then be added to the prize pool.
              </li>
              <li>
                After the question is closed (only possible by Admin), 50% of
                the total profits will be distributed amongst the winners who
                voted the correct answer.
              </li>
            </p>
            <p>Connect your Tezos account to begin!</p>
          </div>
          <ConnectButton
            Tezos={Tezos}
            setContract={setContract}
            setPublicToken={setPublicToken}
            setWallet={setWallet}
            setUserAddress={setUserAddress}
            setUserBalance={setUserBalance}
            setStorage={setStorage}
            contractAddress={contractAddress}
            setBeaconConnection={setBeaconConnection}
            wallet={wallet}
            rpcUrl={RPC_URL}
          />
        </div>
        <Footer />
      </div>
    );
  } else {
    return <div>An error has occurred</div>;
  }
};

export default App;
