import dotenv from 'dotenv';
import Logger from '../main/logger.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';
dotenv.config({ override: true });

class AuthAPI extends BaseAPI {
    #options;

    constructor(options = {}) {
        super(options);
        this.#options = options;
    }

    async auth({ APIName, env }) {
      let API;
      let params;
      if (env === 'prod') {
        params = { 
          login: process.env.AUTH_PROD_LOGIN, 
          password: process.env.AUTH_PROD_PASSWORD 
        }

        this.#options.baseURL = process.env.GATEWAY_PROD_URL;
        API = new AuthAPI(this.#options);
      } else if (env === 'dev') {
        params = { 
          login: process.env.AUTH_DEV_LOGIN, 
          password: process.env.AUTH_DEV_PASSWORD 
        }

        this.#options.baseURL = process.env.GATEWAY_DEV_URL;
        API = new AuthAPI(this.#options);
      } else {
        params = { 
          login: process.env.AUTH_STAGING_LOGIN, 
          password: process.env.AUTH_STAGING_PASSWORD 
        }

        this.#options.baseURL = process.env.GATEWAY_STAGING_URL;
        API = new AuthAPI(this.#options);
      }

      await Logger.log(`[inf]   login in ${APIName} as ${params.login}:`);
  
      return API.post(BotBase.config.API.endpoints.auth.login, params);
    }
}

export default new AuthAPI();