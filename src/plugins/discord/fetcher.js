// @flow

import * as Model from "./models";

const DISCOURSE_API = "https://discordapp.com/api";

type fetchEndpoint = (endpoint: string) => Promise<any>

export interface DiscordApi {
  channels(guild: Model.Snowflake): Promise<$ReadOnlyArray<Model.Channel>>;
}

export class Fetcher {
  +_fetch: fetchEndpoint

  constructor(fetchEndpoint: fetchEndpoint) {
    this._fetch = fetchEndpoint;
  }

  async channels(guild: Model.Snowflake) {
    const channels = await this._fetch(`/guilds/${guild}/channels`);
    return channels.map((x) => ({
      id: x.id,
      name: x.name,
      type: Model.channelTypeFromId(x.type),
    }));
  }

  async members(guild: Model.Snowflake, after: Model.Snowflake, limit: number) {
    const endpoint = `/guilds/${guild}/members?after=${after}&limit=${limit}`;
    const members = await this._fetch(endpoint);
    return members.map((x) => ({
      user: {
        id: x.user.id,
        username: x.user.username,
        discriminator: x.user.discriminator,
        bot: x.user.bot || x.user.system || false,
      },
      nick: x.nick || null,
      roles: x.roles,
    }));
  }

  async messages(
    channel: Model.Snowflake, after: Model.Snowflake, limit: number
  ): Promise<$ReadOnlyArray<Model.Message>> {
    const endpoint = `/channels/${channel}/messages?after=${after}&limit=${limit}`;
    const messages = await this._fetch(endpoint);
    return messages.map((x) => ({
      id: x.id,
      channelId: channel,
      authorId: x.author.id,
      timestampMs: Date.parse(x.timestamp),
      content: x.content,
      reactionEmoji: (x.reactions || []).map((r) => r.emoji),
      nonUserAuthor: x.webhook_id != null || false,
      mentions: (x.mentions || []).map((user) => user.id),
    }));
  }

  async reactions(
    channel: Model.Snowflake,
    message: Model.Snowflake,
    emoji: Model.Emoji,
    after: string,
    limit: number,
  ): Promise<$ReadOnlyArray<Model.Reaction>> {
    const emojiRef = Model.emojiToRef(emoji);
    const endpoint = `/channels/${channel}/messages/${message}/reactions/${emojiRef}?after=${after}&limit=${limit}`
    const reactingUsers = await this._fetch(endpoint)
    return reactingUsers.map((x) => ({
      emoji,
      channelId: channel,
      messageId: message,
      authorId: x.id,
    }));
  }
}
