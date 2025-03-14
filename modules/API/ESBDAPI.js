import dotenv from 'dotenv';
import authAPI from './authAPI.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';
dotenv.config({ override: true });

class ESBDAPI extends BaseAPI {
    #API;

    #options;

    constructor(options = {
        baseURL: '' || process.env.GATEWAY_URL,
    }) {
        super(options);
        this.#options = options;
    }

    async setToken() {
        const response = await authAPI.auth({ APIName: 'ESBD API' });
        this.#options.headers = {};
        this.#options.headers.Authorization = `Bearer ${response.data.data.access_token}`;
        this.#API = new ESBDAPI(this.#options);
    }

    async getContract_By_Number(methodName, number) {
        const params = {
            methodName,
            params: {}
        }

        number.startsWith('901') 
        ? params.params.aPolicyNumber = number
        : params.params.aContractNumber = number

        return await this.#API.post(BotBase.config.API.endpoints.ESBD.callMethod, params);
    }
}

export default new ESBDAPI();