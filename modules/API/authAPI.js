import dotenv from 'dotenv';
import Logger from '../main/logger.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';
dotenv.config({ override: true });

class AuthAPI extends BaseAPI {
    #login;
    #password;

    constructor(options = {}) {
        super(
            options.baseURL || process.env.GATEWAY_URL,
            options.logString ?? '[inf] ▶ set base API URL:',
            options.timeout,
            options.headers
        );
        this.#login = process.env.AUTH_LOGIN;
        this.#password = process.env.AUTH_PASSWORD;
    }

    async auth(user) {
        const params = user 
        ? { login: user.login, password: user.password } 
        : { login: this.#login, password: this.#password };
        Logger.log(`[inf]   login as ${params.login}:`);

        return (await this.post(BotBase.config.API.endpoints.auth.login, params)).data.data.access_token;
    }
}

export default new AuthAPI();