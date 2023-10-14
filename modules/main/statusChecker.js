import ESBDAPI from '../API/ESBDAPI.js';
import { resolveNestedPromises } from 'resolve-nested-promises';

class StatusChecker {
    static async checkESBD(policies) {
        const checkedPolicies = policies.map(async (policy) => {
            if (policy.number.startsWith('122')) {
                const status = (await ESBDAPI.getContract_By_Number('GetContractComplex_By_Number', policy.number))
                .data.data.GetContractComplex_By_NumberResult.CONTRACT_COMPLEX.RESCINDING_REASON_ID;
                return { id: policy.id, status };
            } else if (policy.number.startsWith('802')) {
                const status = (await ESBDAPI.getContract_By_Number('GetContractDsHealth_By_Number', policy.number))
                .data.data.GetContractDsHealth_By_NumberResult.CONTRACT_DS_HEALTH.RESCINDING_REASON_ID;
                return { id: policy.id, status };
            } else if (policy.number.startsWith('911')) {
                const status = (await ESBDAPI.getContract_By_Number('GetContractOsTourist_By_Number', policy.number))
                .data.data.GetContractOsTourist_By_NumberResult.CONTRACT_OS_TOURIST.RESCINDING_REASON_ID;
                return { id: policy.id, status };
            }
        });

        return resolveNestedPromises(checkedPolicies);
    }
}

export default StatusChecker;