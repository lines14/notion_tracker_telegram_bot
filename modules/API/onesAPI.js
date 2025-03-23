import dotenv from 'dotenv';
import authAPI from './authAPI.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';

dotenv.config({ override: true });

class OnesAPI extends BaseAPI {
  #API;

  #options;

  constructor(options = {}) {
    super(options);
    this.#options = options;
  }

  async setToken({ env }) {
    const response = await authAPI.auth({ APIName: 'Ones API', env });
    this.#options.headers = {};
    this.#options.headers.Authorization = `Bearer ${response.data.data.access_token}`;
    if (env === 'prod') {
      this.#options.baseURL = process.env.GATEWAY_PROD_URL;
    } else if (env === 'dev') {
      this.#options.baseURL = process.env.GATEWAY_DEV_URL;
    } else {
      this.#options.baseURL = process.env.GATEWAY_STAGING_URL;
    }

    this.#API = new OnesAPI(this.#options);
  }

  /* eslint camelcase: ["error", {allow: ["num_policy"]}] */
  async getPolicy(num_policy) {
    const params = {
      methodName: 'GetPolicy',
      params: {
        num_policy,
      },
    };

    return this.#API.post(BotBase.config.API.endpoints.ones.callMethod, params);
  }
}

export default new OnesAPI();
