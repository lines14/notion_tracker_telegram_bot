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

  async setToken({ env }) {
    const response = await authAPI.auth({ APIName: 'Dictionary API', env });
    this.#options.headers = {};
    this.#options.headers.Authorization = `Bearer ${response.data.data.access_token}`;
    if (env === 'prod') {
      this.#options.baseURL = process.env.GATEWAY_PROD_URL;
    } else if (env === 'dev') {
      this.#options.baseURL = process.env.GATEWAY_DEV_URL;
    } else {
      this.#options.baseURL = process.env.GATEWAY_STAGING_URL;
    }

    this.#API = new DictionaryAPI(this.#options);
  }

  async toggleServer() {
    const params = {
      setting: BotBase.config.servers,
    };

    return this.#API.post(BotBase.config.API.endpoints.dictionary.servers, params);
  }

  async toggleVerification({ value }) {
    const params = {
      value: Number(value),
    };

    return this.#API.patch(BotBase.config.API.endpoints.dictionary.verifyBool, params);
  }
}

export default DictionaryAPI;
