import dotenv from 'dotenv';
import authAPI from './authAPI.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';

dotenv.config({ override: true });

class ESBDAPI extends BaseAPI {
  #API;

  #options;

  constructor(options = {}) {
    super(options);
    this.#options = options;
  }

  async setToken({ env }) {
    const response = await authAPI.auth({ APIName: 'ESBD API', env });
    this.#options.headers = {};
    this.#options.headers.Authorization = `Bearer ${response.data.data.access_token}`;
    if (env === 'prod') {
      this.#options.baseURL = process.env.GATEWAY_PROD_URL;
    } else if (env === 'dev') {
      this.#options.baseURL = process.env.GATEWAY_DEV_URL;
    } else {
      this.#options.baseURL = process.env.GATEWAY_STAGING_URL;
    }

    this.#API = new ESBDAPI(this.#options);
  }

  async getContract_By_Number(methodName, number) {
    const params = {
      methodName,
      params: {},
    };

    if (number.startsWith('901')) {
      params.params.aPolicyNumber = number;
    } else {
      params.params.aContractNumber = number;
    }

    return this.#API.post(BotBase.config.API.endpoints.ESBD.callMethod, params);
  }
}

export default new ESBDAPI();
