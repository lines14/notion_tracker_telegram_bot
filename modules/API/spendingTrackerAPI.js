import dotenv from 'dotenv';
import Logger from '../main/logger.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';
dotenv.config({ override: true });

class SpendingTrackerAPI extends BaseAPI {
    #API;

    #login;

    #password;

    #options;

    constructor(options = {
        baseURL: '' || process.env.SPENDING_TRACKER_API_URL,
      }) {
        super(options);
        this.#options = options;
        this.#login = '' || process.env.USER_LOGIN;
        this.#password = '' || process.env.USER_PASSWORD;
    }

    async auth({ APIName }) {
        const params = { login: this.#login, password: this.#password };
        await Logger.log(`[inf]   login in ${APIName} as ${params.login}:`);
        return this.post(BotBase.config.API.endpoints.spendingTrackerAPI.auth, params);
    }

    async setToken() {
        const response = await this.auth({ APIName: 'Spending tracker API' });
        this.#options.headers = {};
        this.#options.headers.Authorization = `Bearer ${response.data.data}`;
        this.#API = new SpendingTrackerAPI(this.#options);
    }

    async greetings() {
        return this.#API.get(BotBase.config.API.endpoints.spendingTrackerAPI.greetings);
    }
}

export default new SpendingTrackerAPI();