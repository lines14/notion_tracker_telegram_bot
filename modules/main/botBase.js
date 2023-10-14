import { Telegraf } from 'telegraf';
import config from '../config.json' assert { type: 'json' };

class BotBase {
	static #bot;
	static #config;

	static init() {
		this.#config = JSON.parse(JSON.stringify(config));
		this.#bot = new Telegraf(this.config.bot.credentials.TG_TOKEN, { handlerTimeout: Infinity });
	}

	static get config() {
        return this.#config;
	}

	static get bot() {
		return this.#bot;
	}
}

export default BotBase;