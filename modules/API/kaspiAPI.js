import moment from 'moment';
import dotenv from 'dotenv';
import authAPI from './authAPI.js';
import BaseAPI from '../main/baseAPI.js';
import BotBase from '../main/botBase.js';
import Randomizer from '../main/randomizer.js';

dotenv.config({ override: true });

class KaspiAPI extends BaseAPI {
  #API;

  #options;

  constructor(options = {}) {
    super(options);
    this.#options = options;
  }

  async setToken({ env }) {
    const response = await authAPI.auth({ APIName: 'Kaspi API', env });
    this.#options.headers = {};
    this.#options.headers.Authorization = `Bearer ${response.data.data.access_token}`;
    if (env === 'prod') {
      this.#options.baseURL = process.env.GATEWAY_PROD_URL;
    } else if (env === 'dev') {
      this.#options.baseURL = process.env.GATEWAY_DEV_URL;
    } else {
      this.#options.baseURL = process.env.GATEWAY_STAGING_URL;
    }

    this.#API = new KaspiAPI(this.#options);
  }

  async pay(paymentInfo) {
    const params = {
      command: 'pay',
      txn_id: Randomizer.getRandomString(false, false, true, false, false, 18, 18),
      txn_date: moment().format().slice(0, 19).replace(/-|T|:/g, ''),
      account: paymentInfo.account,
      sum: paymentInfo.sum,
    };

    return this.#API.get(BotBase.config.API.endpoints.kaspi.pay, params);
  }

  async check(paymentInfo) {
    const params = {
      command: 'check',
      txn_id: Randomizer.getRandomString(false, false, true, false, false, 18, 18),
      account: paymentInfo.account,
    };

    return this.#API.get(BotBase.config.API.endpoints.kaspi.check, params);
  }
}

export default new KaspiAPI();
