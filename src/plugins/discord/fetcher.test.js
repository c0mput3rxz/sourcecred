// @flow

import {Fetcher} from "./fetcher";

describe("plugins/discord/fetcher", () => {
  describe("fetch channels", () => {
    it("passes correct endpoint", async () => {
      const fetch = jest.fn(() => Promise.resolve([]));
      const fetcher = new Fetcher(fetch);
      await fetcher.channels("1");
      expect(fetch.mock.calls[0]).toEqual(["/guilds/1/channels"]);
    });

    it("handles response", async () => {
      const response = [
        {
          id: 1,
          name: "testName",
          type: 0,
        },
      ];
      const expected = [
        {
          id: 1,
          name: "testName",
          type: "GUILD_TEXT",
        },
      ];
      const fetch = jest.fn(() => Promise.resolve(response));
      const fetcher = new Fetcher(fetch);
      const channels = await fetcher.channels("1");
      expect(channels).toEqual(expected);
    });

    describe("fetch members", () => {
      it("passes correct endpoint", async () => {
        const fetch = jest.fn(() => Promise.resolve([]));
        const fetcher = new Fetcher(fetch);
        await fetcher.members("1", "0", 1000);
        expect(fetch.mock.calls[0]).toEqual([
          "/guilds/1/members?after=0&limit=1000",
        ]);
      });

      it("handles response", async () => {
        const response = [
          {
            user: {
              id: 1,
              username: "username",
              discriminator: "disc",
              bot: true,
            },
            nick: "nickname",
            roles: ["test role"],
          },
        ];
        const fetch = jest.fn(() => Promise.resolve(response));
        const fetcher = new Fetcher(fetch);
        const members = await fetcher.members("1", "0", 1000);
        expect(members).toEqual(response);
      });
    });

    describe("fetch reactions", () => {
      it("passes correct endpoint", async () => {
        const fetch = jest.fn(() => Promise.resolve([]));
        const fetcher = new Fetcher(fetch);
        const emoji = {id: "1", name: "emojiname"};
        await fetcher.reactions("1", "2", emoji, "0", 100);
        expect(fetch.mock.calls[0]).toEqual([
          `/channels/1/messages/2/reactions/emojiname:1?after=0&limit=100`,
        ]);
      });

      it("handles response", async () => {
        const response = [{id: 3}];
        const fetch = jest.fn(() => Promise.resolve(response));
        const fetcher = new Fetcher(fetch);
        const emoji = {id: "1", name: "emojiname"};
        const reactions = await fetcher.reactions("1", "2", emoji, "0", 100);
        const expected = [{emoji, channelId: "1", messageId: "2", authorId: 3}];
        expect(reactions).toEqual(expected);
      });
    });

    describe("fetch messages", () => {
      it("passes correct endpoint", async () => {
        const fetch = jest.fn(() => Promise.resolve([]));
        const fetcher = new Fetcher(fetch);
        await fetcher.messages("1", "0", 100);
        expect(fetch.mock.calls[0]).toEqual([
          "/channels/1/messages?after=0&limit=100",
        ]);
      });

      it("handles response", async () => {
        const response = [
          {
            id: 1,
            author: {id: 2},
            timestamp: "2020-03-03T23:35:10.615000+00:00",
            content: "Just going to drop this here",
            reactions: [{emoji: {id: 123, name: "testemoji"}}],
            mentions: [{id: 4, username: "testuser"}],
          },
        ];

        const expected = [
          {
            id: 1,
            channelId: "123",
            authorId: 2,
            timestampMs: Date.parse("2020-03-03T23:35:10.615000+00:00"),
            content: "Just going to drop this here",
            reactionEmoji: [{id: 123, name: "testemoji"}],
            nonUserAuthor: false,
            mentions: [4],
          },
        ];

        const fetch = jest.fn(() => Promise.resolve(response));
        const fetcher = new Fetcher(fetch);
        const messages = await fetcher.messages("123", "0", 100);
        expect(messages).toEqual(expected);
      });
    });
  });
});
