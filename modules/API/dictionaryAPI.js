import dotenv from 'dotenv';
import authAPI from './authAPI.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';
dotenv.config({ override: true });

class DictionaryAPI extends BaseAPI {
    #API;

    #options;

    constructor(options = {}) {
        super(options);
        this.#options = options;
    }

    async setToken(env) {
        const response = await authAPI.auth({ APIName: 'Dictionary API', env });
        this.#options.headers = {};
        this.#options.headers.Authorization = `Bearer ${response.data.data.access_token}`;
        this.#API = new DictionaryAPI(this.#options);
    }

    async toggleServer() {
        const params = {
          setting: BotBase.config.servers,
        };
    
        return this.#API.post(BotBase.config.dictionary.servers, params);
    }
    
    async toggleVerification(value) {
        const params = {
            value,
        };

        return this.#API.patch(BotBase.config.dictionary.verifyBool, params);
    }
}

export default new DictionaryAPI();