import dotenv from 'dotenv';
import authAPI from './authAPI.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';
dotenv.config({ override: true });

class OnesAPI extends BaseAPI {
    #API;

    #options;

    constructor(options = {
        baseURL: '' || process.env.GATEWAY_URL,
    }) {
        super(options);
        this.#options = options;
    }

    async setToken() {
        const response = await authAPI.auth({ APIName: 'Ones API' });
        this.#options.headers = {};
        this.#options.headers.Authorization = `Bearer ${response.data.data.access_token}`;
        this.#API = new OnesAPI(this.#options);
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