// @flow

import {makeDiscordFetch} from "./fetchDiscord";

describe("plugins/discord/fetchDiscord", () => {
  const response = (status) =>
    Promise.resolve(new Response("{}", {status: status}));

  describe("makeDiscordFetch", () => {
    it("passes correct options and url", async () => {
      const fetch = jest.fn(() => response(200));
      const discordFetch = makeDiscordFetch(fetch, "testtoken");
      await discordFetch("endpoint");
      const options = {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bot testtoken",
        },
      };
      const url = "https://discordapp.com/api/endpoint";
      expect(fetch.mock.calls[0]).toEqual([url, options]);
    });
  });

  it("retries on 429", async () => {
    const fetch = jest
      .fn()
      .mockImplementationOnce(() => response(429))
      .mockImplementationOnce(() => response(200));
    const discordFetch = makeDiscordFetch(fetch, "testtoken");
    await discordFetch("endpoint");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("errors on 403", async () => {
    const fetch = jest.fn(() => response(403));
    const discordFetch = makeDiscordFetch(fetch, "testtoken");
    await expect(discordFetch("endpoint")).rejects.toThrow(
      "403 Forbidden: bad API username or key?"
    );
  });

  it("errors on 404", async () => {
    const fetch = jest.fn(() => response(404));
    const discordFetch = makeDiscordFetch(fetch, "testtoken");
    await expect(discordFetch("endpoint")).rejects.toThrow(
      "404 Not Found on: ; maybe bad serverUrl?"
    );
  });

  it("errors on 410", async () => {
    const fetch = jest.fn(() => response(410));
    const discordFetch = makeDiscordFetch(fetch, "testtoken");
    await expect(discordFetch("endpoint")).rejects.toThrow("410 Gone");
  });
});
