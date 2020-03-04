// @flow

import fetch from "isomorphic-fetch";
import retry from "retry";
import {type BotToken} from "./models";

const DISCORD_SERVER = "https://discordapp.com/api";

function tryDiscordFetch(fetch, url, fetchOptions) {
  return fetch(url, fetchOptions).then((response) => {
    switch (response.status) {
      case 403:
        return Promise.reject({
          retry: false,
          message: `403 Forbidden: bad API username or key?\n${response.url}`,
        });
      case 404:
        return Promise.reject({
          retry: false,
          message: `404 Not Found on: ${response.url}; maybe bad serverUrl?`,
        });
      case 410:
        return Promise.reject({retry: false, message: `410 Gone`});
      case 429:
        return Promise.reject({retry: true, message: null});
      default:
        return Promise.resolve(response.json());
    }
  });
}

function retryDiscordFetch(fetch, url, fetchOptions) {
  return new Promise((resolve, reject) => {
    const operation = retry.operation();
    operation.attempt(() => {
      tryDiscordFetch(fetch, url, fetchOptions)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          if (error.retry && operation.retry(true)) {
            return;
          } else if (error.message) {
            reject(new Error(error.message));
          } else {
            reject(error);
          }
      });
    });
  });
}

export function makeDiscordFetch(fetch: typeof fetch, token: BotToken) {
  return async (endpoint: string) => {
    const fetchOptions = {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bot ${token}`,
      },
    };
    const url = new URL(`${DISCORD_SERVER}/${endpoint}`).href;
    return retryDiscordFetch(fetch, url, fetchOptions);
  };
}

export const discordFetch = (token: BotToken) => makeDiscordFetch(fetch, token);
