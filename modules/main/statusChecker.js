/* eslint no-restricted-syntax: ['off', 'ForInStatement'] */
import BotBase from './botBase.js';
import onesAPI from '../API/onesAPI.js';
import ESBDAPI from '../API/ESBDAPI.js';

class StatusChecker {
  static async getStatusESBD(policies) {
    await ESBDAPI.setToken({ env: 'prod' });
    for (const policy of policies) {
      policy.status = {};
      for (const key of Object.keys(BotBase.config.API.endpoints.ESBD.submethods)) {
        if (policy.number.startsWith(key)) {
          const submethod = BotBase.config.API.endpoints.ESBD.submethods[key];
          // eslint-disable-next-line no-await-in-loop
          const response = await ESBDAPI.getContract_By_Number(submethod, policy.number);
          if (response.data.success) {
            const productKey = key === '901'
              ? 'Policy'
              : submethod.split('_').reverse().pop().slice(3)
                .split(/(?=[A-Z])/)
                .join('_')
                .toUpperCase();
            const contracts = response.data.data[`${submethod}Result`][productKey];
            let policyStatus;
            let contractState;
            if (Array.isArray(contracts)) {
              policyStatus = contracts[contracts.length - 1].RESCINDING_REASON_ID;
              contractState = contracts[contracts.length - 1].CONTRACT_STATE;
            } else {
              policyStatus = contracts.RESCINDING_REASON_ID;
              contractState = contracts.CONTRACT_STATE;
            }

            policy.status.ESBD = policyStatus;
            if (contractState === 'Черновик') policy.status.ESBD = contractState;
          }
        }
      }

      if (!policy.status.ESBD && policy.status.ESBD !== 0) policy.status.ESBD = 'default';
    }

    return policies;
  }

  static async getStatusOnes(policies) {
    await onesAPI.setToken({ env: 'prod' });
    for (const policy of policies) { // eslint-disable-next-line no-await-in-loop
      const response = await onesAPI.getPolicy(policy.number);
      if (response.data.contracts) {
        policy.status.ones = response.data.contracts[0].policy_status;
      } else if (response.data.errors?.contracts) {
        policy.status.ones = response.data.errors.contracts[0].match(/удаление/).reverse().pop();
      } else {
        policy.status.ones = 'default';
      }
    }

    return policies;
  }
}

export default StatusChecker;
