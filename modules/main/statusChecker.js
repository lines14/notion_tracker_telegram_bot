import BotBase from './botBase.js';
import onesAPI from '../API/onesAPI.js';
import ESBDAPI from '../API/ESBDAPI.js';

class StatusChecker {
    static async getStatusESBD(policies) {
        await ESBDAPI.setToken();
        for (const policy of policies) {
            policy.status = {};
            for (const key of Object.keys(BotBase.config.API.endpoints.ESBD.submethods)) {
                if (policy.number.startsWith(key)) {
                    const submethod = BotBase.config.API.endpoints.ESBD.submethods[key];
                    const response = await ESBDAPI.getContract_By_Number(submethod, policy.number);
                    if (response.data.success) {
                        const productKey = key === '901' 
                        ? 'Policy' 
                        : submethod.split('_').reverse().pop().slice(3).split(/(?=[A-Z])/).join('_').toUpperCase();
                        policy.status.ESBD = response.data.data[`${submethod}Result`][productKey].RESCINDING_REASON_ID;
                    }
                }
            }
        }

        return policies;
    }

    static async getStatusOnes(policies) {
        await onesAPI.setToken();
        for (const policy of policies) {
            const response = await onesAPI.getPolicy(policy.number);
            if (response.data.contracts) {
                policy.status.ones = response.data.contracts[0].policy_status;
            } else if (response.data.error.errors.contracts) {
                policy.status.ones = response.data.error.errors.contracts[0].match(/удаление/).reverse().pop();
            }
        }

        return policies;
    }
}

export default StatusChecker;