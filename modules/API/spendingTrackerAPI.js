import dotenv from 'dotenv';
import Logger from '../main/logger.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';
dotenv.config({ override: true });

class SpendingTrackerAPI extends BaseAPI {
    #API;
    #login;
    #password;

    constructor(options = {}) {
        super(
            options.baseURL || process.env.SPENDING_TRACKER_API_URL,
            options.logString ?? '[inf] ▶ set base API URL:',
            options.timeout,
            options.headers
        );
        this.#login = process.env.USER_LOGIN;
        this.#password = process.env.USER_PASSWORD;
    }

    async auth() {
        const params = { 
            login: this.#login, 
            password: this.#password 
        };

        await Logger.log(`[inf]   login as ${params.login}:`);

        return (await this.post(BotBase.config.API.endpoints.spendingTrackerAPI.auth, params)).data.data;
    }

    async setToken() {
        this.#API = new SpendingTrackerAPI({ 
            headers: { 
                Authorization: `Bearer ${await this.auth({ APIName: 'Spending tracker API' })}` 
            } 
        });
    }

    async greetings() {
        return this.#API.get(BotBase.config.API.endpoints.spendingTrackerAPI.greetings);
    }
}

export default new SpendingTrackerAPI();