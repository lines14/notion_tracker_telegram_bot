import Notion from './notion.js';
import Logger from './logger.js';
import BotBase from './botBase.js';
import schedule from 'node-schedule';
import fastAPI from '../API/fastAPI.js';
import { message } from 'telegraf/filters';
import StatusChecker from './statusChecker.js';

class Handlers {
    static async checkAndNotify(ctx) {
        let policies = await Notion.getNotCancelledPolicies(BotBase.config.adminsID.includes(ctx.from.id) 
        || BotBase.config.adminsID.includes(ctx.message.chat.id));
        policies = await StatusChecker.getStatusESBD(policies);
        policies = await StatusChecker.getStatusOnes(policies);
        await Notion.updateNotCancelledPolicies(policies, BotBase.config.adminsID.includes(ctx.from.id) 
        || BotBase.config.adminsID.includes(ctx.message.chat.id));

        const issuedOnesKeys = Object.keys(BotBase.config.API.statuses.ones)
        .filter((key) => BotBase.config.API.statuses.ones[key] === 'Выписан').map(Number);
        const issuedESBDKeys = Object.keys(BotBase.config.API.statuses.ESBD)
        .filter((key) => BotBase.config.API.statuses.ESBD[key] === 'Выписан').map(Number);

        let notification = BotBase.config.adminsID.includes(ctx.from.id) 
        || BotBase.config.adminsID.includes(ctx.message.chat.id) 
        ? 'Тестовые полисы на PROD:' 
        : 'Полисы на PROD:';
        
        policies.forEach((policy) => {
            policy.notifications = [];
            if (policy.status.ones === 'default') policy.notifications.push('\n❓статус 1С неизвестен');
            if (policy.status.ESBD === 'default') policy.notifications.push('\n❓статус ЕСБД неизвестен');
            if (issuedOnesKeys.includes(policy.status.ones)) {
                policy.notifications.push(BotBase.config.adminsID.includes(ctx.from.id) 
                || BotBase.config.adminsID.includes(ctx.message.chat.id) 
                ? '\n❗не отменён в 1С' 
                : '\n✅ выписан в 1С');
            }

            if (issuedESBDKeys.includes(policy.status.ESBD)) {
                policy.notifications.push(BotBase.config.adminsID.includes(ctx.from.id) 
                || BotBase.config.adminsID.includes(ctx.message.chat.id) 
                ? '\n❗не отменён в ЕСБД' 
                : '\n✅ выписан в ЕСБД');
            }

            if (policy.status.ESBD === 'Черновик') policy.notifications.push('\n📌черновик в ЕСБД');

            if (policy.notifications.length !== 0) {
                policy.notifications.unshift(`\n\n${policy.number}:`);
                policy.notifications.forEach((message) => notification = notification + message);
            }
        });

        if (notification.length === 24) notification = 'Выписанных тестовых полисов на PROD нет';
        if (notification.length === 15) notification = '❌ Выписанных полисов на PROD нет\n(список проверяемых полисов был очищен, добавьте другие или прежние повторно)';

        ctx.reply(notification);
        await Logger.log('[inf] ▶ Уведомление отправлено');
    }

    static commands(bot, crontab) {
        let job;
        bot.command('run', async (ctx) => {
            if (BotBase.config.adminsID.includes(ctx.from.id) 
            || BotBase.config.adminsID.includes(ctx.message.chat.id)) {
                ctx.deleteMessage();
                job = schedule.scheduleJob(crontab, async () => {
                    await Logger.log('[inf] ▶ Запущено обновление статусов');
                    await this.checkAndNotify(ctx);
                });
                
                ctx.reply('Cron запущен');
                await Logger.log('[inf] ▶ Cron запущен');
            }
        });

        bot.command('update', async (ctx) => {
            ctx.deleteMessage();
            await Logger.log('[inf] ▶ Запущено обновление статусов');
            await this.checkAndNotify(ctx);
        });

        bot.command('get', async (ctx) => {
            ctx.deleteMessage();
            await fastAPI.auth();
            const response = await fastAPI.get();
            ctx.reply(response.data.message);
        });

        bot.command('stop', async (ctx) => {
            if (BotBase.config.adminsID.includes(ctx.from.id) 
            || BotBase.config.adminsID.includes(ctx.message.chat.id)) {
                ctx.deleteMessage();
                if (job) job.cancel();
                ctx.reply('Cron остановлен');
                await Logger.log('[inf] ▶ Cron остановлен');
            }
        });

        bot.on(message('text'), async (ctx) => {
            for (const key of Object.keys(BotBase.config.API.endpoints.ESBD.submethods)) {
                if ((ctx.message.text.startsWith(key) 
                && !(BotBase.config.adminsID.includes(ctx.from.id) 
                || BotBase.config.adminsID.includes(ctx.message.chat.id))) 
                || (ctx.message.text.startsWith(`+${key}`) 
                && (BotBase.config.adminsID.includes(ctx.from.id) 
                || BotBase.config.adminsID.includes(ctx.message.chat.id)))) {
                    await Notion.addPolicy(ctx);
                    ctx.reply('Полис добавлен');
                }
            }
        });
    }
}

export default Handlers;