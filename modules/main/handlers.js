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

        let notification = 'Тестовые полисы на PROD:';
        policies.forEach((policy) => {
            policy.notifications = [];
            if (policy.status.ones === 'default') policy.notifications.push('\n❓статус 1С неизвестен');
            if (policy.status.ESBD === 'default' ) policy.notifications.push('\n❓статус ЕСБД неизвестен');
            if (issuedOnesKeys.includes(policy.status.ones)) policy.notifications.push('\n❗не отменён в 1С');
            if (issuedESBDKeys.includes(policy.status.ESBD)) policy.notifications.push('\n❗не отменён в ЕСБД');
            if (policy.notifications.length !== 0) {
                policy.notifications.unshift(`\n\n${policy.number}:`);
                policy.notifications.forEach((message) => notification = notification + message);
            }
        });

        if (notification.length === 24) {
            notification = 'Выписанных тестовых полисов на PROD нет';
        }

        ctx.reply(notification);
        Logger.log('[inf] ▶ Уведомление отправлено');
    }

    static commands(bot) {
        let job;
        bot.command('run', async (ctx) => {
            job = schedule.scheduleJob('0 4-16 * * 1-5', async () => {
                Logger.log('[inf] ▶ Запущено обновление статусов');
                await this.checkAndNotify(ctx);
            });
            ctx.deleteMessage();
            Logger.log('[inf] ▶ Cron запущен');
        });

        bot.command('update', async (ctx) => {
            Logger.log('[inf] ▶ Запущено обновление статусов');
            await this.checkAndNotify(ctx);
            ctx.deleteMessage();
        });

        bot.command('stop', (ctx) => {
            if (job) job.cancel();
            ctx.deleteMessage();
            Logger.log('[inf] ▶ Cron остановлен');
        });
    }
}

export default Handlers;