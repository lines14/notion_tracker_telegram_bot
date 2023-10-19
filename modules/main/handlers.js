import Notion from './notion.js';
import Logger from './logger.js';
import BotBase from './botBase.js';
import schedule from "node-schedule";
import StatusChecker from './statusChecker.js';

class Handlers {
    static async checkAndNotify(ctx) {
        let policies = await Notion.getNotCancelledPolicies();
        policies = await StatusChecker.getStatusESBD(policies);
        policies = await StatusChecker.getStatusOnes(policies);
        await Notion.updateNotCancelledPolicies(policies);

        const issuedOnesKeys = Object.keys(BotBase.config.API.statuses.ones)
        .filter((key) => BotBase.config.API.statuses.ones[key] === 'Выписан').map(Number);
        const issuedESBDKeys = Object.keys(BotBase.config.API.statuses.ESBD)
        .filter((key) => BotBase.config.API.statuses.ESBD[key] === 'Выписан').map(Number);

        let notification = 'Статусы полисов обновлены';
        policies.forEach((policy) => {
            if (issuedOnesKeys.includes(policy.status.ones) && issuedESBDKeys.includes(policy.status.ESBD)) {
                notification = notification + `:\n${policy.number} не отменён в 1С и ЕСБД`;
            } else if (issuedOnesKeys.includes(policy.status.ones) && !issuedESBDKeys.includes(policy.status.ESBD)) {
                notification = notification + `:\n${policy.number} не отменён в 1С`;
            } else if (!issuedOnesKeys.includes(policy.status.ones) && issuedESBDKeys.includes(policy.status.ESBD)) {
                notification = notification + `:\n${policy.number} не отменён в ЕСБД`;
            }
        });

        ctx.reply(notification);
        Logger.log('[inf] ▶ Уведомление отправлено');
    }

    static commands(bot) {
        let job;
        bot.command('start', async (ctx) => {
            job = schedule.scheduleJob('0 8-20 * * 1-5', async () => {
                Logger.log('[inf] ▶ Запущено обновление статусов');
                await this.checkAndNotify(ctx);
            });
            Logger.log('[inf] ▶ Cron запущен');
        });

        bot.command('update', async (ctx) => {
            Logger.log('[inf] ▶ Запущено обновление статусов');
            await this.checkAndNotify(ctx);
        });

        bot.command('stop', (ctx) => {
            if (job) job.cancel();
            Logger.log('[inf] ▶ Cron остановлен');
        });
    }
}

export default Handlers;