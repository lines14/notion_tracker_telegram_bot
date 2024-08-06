import dotenv from 'dotenv';
import authAPI from './authAPI.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';
dotenv.config({ override: true });

class OnesAPI extends BaseAPI {
    #API;

    constructor(options = {}) {
        super(
            options.baseURL || process.env.GATEWAY_URL,
            options.logString,
            options.timeout, 
            options.headers
        );
    }

    async setToken() {
        this.#API = new OnesAPI({ headers: { Authorization: `Bearer ${await authAPI.auth()}` } });
    }

    async getPolicy(num_policy) {
        const params = {
            methodName: "GetPolicy",
            params: {
                num_policy
            }
        }

        return await this.#API.post(BotBase.config.API.endpoints.ones.callMethod, params);
    }
}

export default new OnesAPI();