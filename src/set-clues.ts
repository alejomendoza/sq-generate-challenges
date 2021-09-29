import axios from "axios";
import { dummyChallenges } from "./dummy-challenges";

const apiUrl = "https://stellar-quest-dev.sdf-ecosystem.workers.dev";
const debugUrl = `${apiUrl}/lobby-index/debug`;

export type Clue = {
  type: "emoji" | "image" | "text";
  value: string;
};

export type Challenge = {
  clues: Clue[];
  target: string;
  sequence: number;
  amount: number;
};

export function getLobbyId() {
  return axios
    .get(debugUrl)
    .then(({ data }) => data[0].id)
    .catch((error) => error.response.data);
}

export function setClues(lobbyId: string, challenges: Challenge[]) {
  return axios
    .post(`${apiUrl}/lobby/${lobbyId}/set-challenges`, {
      body: {
        challenges: challenges,
        lobbyId: lobbyId
      }
    })
    .then(({ data }) => data)
    .catch((error) => error.response.data);
}
