import BasePlugin from "./base-plugin.js";

export default class DisbandSquadByName extends BasePlugin {
  static get description() {
    return "The plugin for disband squad by his name";
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      names: {
        required: true,
        description: "The list of squad name regex",
        default: [
          {
            regexes: ["", ""],
            messages: ["message 1", "message 2"],
          },
          {
            regexes: ["", ""],
            messages: ["message 1", "message 2"],
          },
        ],
      },
      message_frequency: {
        required: false,
        description: "The message frequency",
        default: 5,
      },
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.warns = this.warns.bind(this);
    this.checkSquadName = this.checkSquadName.bind(this);
  }

  async mount() {
    this.server.on("SQUAD_CREATED", async (data) => {
      if (data.player) {
        this.checkSquadName(data.squadName.toLowerCase().trim(), data.player);
      }
    });
  }

  async checkSquadName(squadName, player) {
    for (const { regexes, messages } of this.options.names) {
      for (const regex of regexes) {
        if (squadName.match(regex)) {
          this.verbose(
            1,
            `Сквад ${player.squadID}/${player.teamID} был расформирован за название отряда ${squadName} по regex ${regex}`
          );
          await Promise.all([
            this.server.rcon.execute(`AdminDisbandSquad ${player.teamID} ${player.squadID}`),
            this.warns(player.eosID, messages, this.options.message_frequency),
          ]);
        }
      }
    }
  }

  async warns(playerID, messages, frequency = 5) {
    for (const [index, message] of messages.entries()) {
      await this.server.rcon.warn(playerID, message);

      if (index != messages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, frequency * 1000));
      }
    }
  }
}
