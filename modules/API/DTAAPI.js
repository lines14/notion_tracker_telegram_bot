import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';

class DTAAPI extends BaseAPI {
    constructor(options = {}) {
        super(
            options.baseURL || BotBase.config.API.hosts.ONES_HOST_REST_URL,
            options.logString ?? '[inf] ▶ set base API URL:',
            options.timeout || BotBase.config.timeout, 
            options.headers || {
                'Authorization': 'Basic ' + btoa(BotBase.config.API.credentials.ONES_LOGIN + ':' + BotBase.config.API.credentials.ONES_PASSWORD),
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