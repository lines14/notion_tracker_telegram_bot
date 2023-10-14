import dotenv from 'dotenv';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';
dotenv.config({ override: true });

class DTAAPI extends BaseAPI {
    constructor(options = {}) {
        super(
            options.baseURL || process.env.ONES_HOST_REST_URL,
            options.logString ?? '[inf] ▶ set base API URL:',
            options.timeout || process.env.TIMEOUT, 
            options.headers || {
                'Authorization': 'Basic ' + btoa(process.env.ONES_LOGIN + ':' + process.env.ONES_PASSWORD),
            }
        );
    }

    async getPolicy(num_policy) {
        const params = { 
            num_policy
        }

        return await this.get(BotBase.config.API.endpoints.DTA.getPolicy, params);
    }
}

export default new DTAAPI();