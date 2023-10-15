import Notion from './notion.js';
import Logger from './logger.js';
import StatusChecker from './statusChecker.js';

class Handlers {
    static handlers(bot) {
        bot.command('update', async (ctx) => {
            const policies = await Notion.getNotCancelledPolicies();
            let checkedPolicies = await StatusChecker.checkESBD(policies);
            checkedPolicies = await StatusChecker.checkOnes(checkedPolicies);
            await Notion.updateNotCancelledPolicies(checkedPolicies);
            let notification = 'Статусы полисов обновлены';
            checkedPolicies.forEach((policy) => {
                if (policy.status.ones === 8 && policy.status.ESBD === 0) {
                    notification = notification + `:\n${policy.number} не отменён в 1С и ЕСБД`;
                } else if (policy.status.ones === 8 && policy.status.ESBD !== 0) {
                    notification = notification + `:\n${policy.number} не отменён в 1С`;
                } else if (policy.status.ones !== 8 && policy.status.ESBD === 0) {
                    notification = notification + `:\n${policy.number} не отменён в ЕСБД`;
                }
            });
            ctx.reply(notification);
            Logger.log('[inf] ▶ Уведомление отправлено');
        });
    }
}

export default Handlers;