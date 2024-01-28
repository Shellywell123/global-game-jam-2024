import { AppProvider } from "@pixi/react";
import { Application } from "pixi.js";
import React, { ReactElement, useEffect, useState } from "react";
import FullScreenStage from "../components/FullScreenStage";
import MainPageBackground from "../components/MainPageBackground";
import PromptList from "../components/PromptList";
import UserData from "../data/UserData";
import KeyPress from "../data/keyPress";
import * as events from "../events";
import RoundState from "../gamestates/RoundState";
import WaitingForPlayers from "../gamestates/WaitingForPlayers";
import { WaitingForNextRound, WaitingForNextRoundProps } from "../gamestates/WaitingForNextRound";
import GameState from "../gamestates/GameState";

// TODO: is there a better way to do this than just declaring here?
const pixiApp = new Application({ resizeTo: window });

const MainPage = () => {
  // BED says which user / side of keyboard
  const [allowList, setAllowList] = useState<string[]>([]);

  const client_id = Date.now();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [user_data, setUserData] = useState<UserData | null>(null);
  const [ownAnswers, setOwnAnswers] = useState<KeyPress[]>([]);
  const [enemyAnswers, setEnemyAnswers] = useState<KeyPress[]>([]);
  const [wordLengths, setWordLengths] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.WaitingForPlayers);
  const [winState, setWinState] = useState<WaitingForNextRoundProps>({winner: false, winningText: ""})

  useEffect(() => {
    const newWs = new WebSocket(`ws://${window.location.host}/ws/${client_id}`);
    console.log(client_id);
    setWs(newWs);
    // return () => {
    //   newWs.close();
    // };
  }, []);

  useEffect(() => {
    if (ws) {
      ws.onmessage = function (content) {
        console.log(content);

        let event = JSON.parse(content.data);
        switch (event.eventType) {
          case "teamAssignment":
            events.teamAssignment(event, setUserData, setAllowList);
            break;
          case "submissionState":
            events.submissionState(event);
            break;
          case "keyBuffer":
            if (user_data) {
              events.keyBuffer(event, user_data.team, setOwnAnswers, setEnemyAnswers);
            }
            break;
          case "keyBuffer":
            if (user_data) {
              events.keyBuffer(event, user_data.team, setOwnAnswers, setEnemyAnswers);
            }
            break;
          // if keyPress is recieved (we dont want to do anthing here?)
          case "keyPress":
            events.keyPress(event);
            events.keyPress(event);
            break;
          case "setup":
            events.setup(event, setGameState, setWordLengths, setOwnAnswers, setEnemyAnswers);
            break;
          case "roundOver":
            events.roundOver(event, user_data ? user_data.team : -1, setGameState, setWinState);
            break;
        }
      };
    }
  }, [ws, user_data, client_id]);

  useEffect(() => {
    const handleKeyUp = (event: any) => {
      const is_allowed = gameState == GameState.PlayingRound && allowList.includes(event.key.toLowerCase());
      is_allowed ? console.log("send to server") : console.log("ignore");
      if (is_allowed && ws) {
        ws.send(events.sendKey(event.key));
      }
    };

    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [ws, allowList, gameState]);

  // TODO is this needed?
  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = document.getElementById("messageText") as HTMLInputElement;

    if (input && ws) {
      // pass the key to the server in json format
      ws.send(events.sendKey(input.value));
      // clear the input value
      input.value = "";
    }
  }

  var gameStateUi: ReactElement;
  switch (gameState) {
    case GameState.WaitingForPlayers:
      gameStateUi = <WaitingForPlayers />
      break;
    case GameState.PlayingRound:
      gameStateUi = <RoundState
        wordLengths={wordLengths}
        userId={user_data?.userid}
        ownAnswers={ownAnswers}
        enemyAnswers={enemyAnswers}
      />
      break;
    case GameState.WaitingForNextRound:
      gameStateUi = <WaitingForNextRound {...winState}/>
      break;
  }

  return (
    <div className="flex flex-col items-center bg-orange-300 w-full h-full">
      <div className="w-full h-full flex relative">
        <AppProvider value={pixiApp}>
          <FullScreenStage>
            <MainPageBackground />
            {gameStateUi}
          </FullScreenStage>
        </AppProvider>
        <PromptList />
      </div>
    </div>
  );
};

export default MainPage;
