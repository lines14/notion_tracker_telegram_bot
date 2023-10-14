import authAPI from './authAPI.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';

class ESBDAPI extends BaseAPI {
    #API;

    constructor(options = {}) {
        super(
            options.baseURL || BotBase.config.API.hosts.GATEWAY_URL,
            options.logString,
            options.timeout, 
            options.headers
        );
    }

    async setToken() {
        this.#API = new ESBDAPI({ headers: { Authorization: `Bearer ${await authAPI.auth()}` } });
    }

    async getContract_By_Number(methodName, aContractNumber) {
        const params = {
            methodName,
            params: {
                aContractNumber
            }
        }

        return await this.#API.post(BotBase.config.API.endpoints.ESBD.callMethod, params);
    }
}

export default new ESBDAPI();