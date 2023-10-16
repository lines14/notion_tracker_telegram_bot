import Notion from './notion.js';
import Logger from './logger.js';
import schedule from "node-schedule";
import StatusChecker from './statusChecker.js';

class Handlers {
    static async checkAndNotify(ctx) {
        let policies = await Notion.getNotCancelledPolicies();
        policies = await StatusChecker.getStatusESBD(policies);
        policies = await StatusChecker.getStatusOnes(policies);
        await Notion.updateNotCancelledPolicies(policies);

        let notification = 'Статусы полисов обновлены';
        policies.forEach((policy) => {
            console.log(policy);
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
    }

    static commands(bot) {
        let job;
        bot.command('start', async (ctx) => {
            job = schedule.scheduleJob('0 * * * *', async () => {
                await this.checkAndNotify(ctx);
            });
        });

        bot.command('update', async (ctx) => {
            await this.checkAndNotify(ctx);
        });

        bot.command('stop', (ctx) => {
            if (job) job.cancel();
        });
    }
}

export default Handlers;