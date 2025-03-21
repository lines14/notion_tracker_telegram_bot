import axios from 'axios';
import Logger from './logger.js';

class BaseAPI {
    #baseURL;
    #logString;
    #timeout;
    #headers;
    #axiosInstance;

    constructor(options) {
        this.#baseURL = options.baseURL;
        this.#logString = options.logString;
        this.#timeout = options.timeout;
        this.#headers = options.headers;
        this.#axiosInstance = this.createInstance();
    }

    createInstance() {
        if (this.#logString) Logger.log(`${this.#logString} ${this.#baseURL}`);
        return axios.create({
            baseURL: this.#baseURL,
            timeout: this.#timeout,
            headers: this.#headers,
        });
    }

    async get(endpoint, params) {
        await Logger.log(`[req] ▶ get ${JSON.stringify(params ? params : {})} from ${endpoint}:`);
        try {
            const response = await this.#axiosInstance.get(`/${endpoint}`, { params });
            await Logger.log(`[res]   status code: ${response.status}`);
            return response;
        } catch (error) {
            await Logger.log(`[res]   status code: ${error.response.status}`);
            await Logger.log(`[res]   body: ${JSON.stringify(error.response.data)}`);
            return error.response;
        }
    }

    async post(endpoint, params) {
        await Logger.log(`[req] ▶ post ${JSON.stringify(params ? params : {})} to ${endpoint}:`);
        try {
            const response = await this.#axiosInstance.post(`/${endpoint}`, params);
            await Logger.log(`[res]   status code: ${response.status}`);
            return response;
        } catch (error) {
            await Logger.log(`[res]   status code: ${error.response.status}`);
            await Logger.log(`[res]   body: ${JSON.stringify(error.response.data)}`);
            return error.response;
        }
    }

    async patch(endpoint, params) {
        await Logger.log(`[req] ▶ patch ${JSON.stringify(params ? params : {})} to ${endpoint}:`);
        try {
            const response = await this.#axiosInstance.patch(`/${endpoint}`, params);
            await Logger.log(`[res]   status code: ${response.status}`);
            return response;
        } catch (error) {
            await Logger.log(`[res]   status code: ${error.response.status}`);
            await Logger.log(`[res]   body: ${JSON.stringify(error.response.data)}`);
            return error.response;
        }
    }
}

export default BaseAPI;