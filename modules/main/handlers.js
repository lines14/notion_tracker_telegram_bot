import dotenv from 'dotenv';
import Notion from './notion.js';
import Logger from './logger.js';
import { Markup } from 'telegraf';
import BotBase from './botBase.js';
import schedule from 'node-schedule';
import { message } from 'telegraf/filters';
import StatusChecker from './statusChecker.js';
import DictionaryAPI from '../API/dictionaryAPI.js';
import spendingTrackerAPI from '../API/spendingTrackerAPI.js';
dotenv.config({ override: true });

class Handlers {
    static async toggleVerification(ctx, env, value) {
        const dictionaryAPI = new DictionaryAPI();
        await dictionaryAPI.setToken({ env });
        await dictionaryAPI.toggleServer();
        await dictionaryAPI.toggleVerification({ value });
        const statusText = value ? 'включена' : 'отключена';
        const message = `Сверка на ${env} ${statusText}`;
        await Logger.log(`[inf] ▶ ${message}`);
        ctx.reply(message);
    }

    static async checkAndNotify(ctx) {
        let policies = await Notion.getNotCancelledPolicies(JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
        || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id));
        policies = await StatusChecker.getStatusESBD(policies);
        policies = await StatusChecker.getStatusOnes(policies);
        await Notion.updateNotCancelledPolicies(policies, JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
        || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id));

        const issuedOnesKeys = Object.keys(BotBase.config.API.statuses.ones)
        .filter((key) => BotBase.config.API.statuses.ones[key] === 'Выписан').map(Number);
        const issuedESBDKeys = Object.keys(BotBase.config.API.statuses.ESBD)
        .filter((key) => BotBase.config.API.statuses.ESBD[key] === 'Выписан').map(Number);

        let notification = JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
        || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id) 
        ? 'Тестовые полисы на PROD:' 
        : 'Полисы на PROD:';
        
        policies.forEach((policy) => {
            policy.notifications = [];
            if (policy.status.ones === 'default') policy.notifications.push('\n❓статус 1С неизвестен');
            if (policy.status.ESBD === 'default') policy.notifications.push('\n❓статус ЕСБД неизвестен');
            if (issuedOnesKeys.includes(policy.status.ones)) {
                policy.notifications.push(JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
                || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id) 
                ? '\n❗не отменён в 1С' 
                : '\n✅ выписан в 1С');
            }

            if (issuedESBDKeys.includes(policy.status.ESBD)) {
                policy.notifications.push(JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
                || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id) 
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

    static commands(bot, policyCheckCrontab, verificationToggleCrontab) {
        let policyCheckJob;
        let verificationToggleJob;

        bot.command('run', async (ctx) => {
            if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
            || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
                ctx.deleteMessage();
                policyCheckJob = schedule.scheduleJob(policyCheckCrontab, async () => {
                    await Logger.log('[inf] ▶ Запущено обновление статусов');
                    await this.checkAndNotify(ctx);
                });
                const message = 'Cron отслеживания полисов запущен';
                await Logger.log(`[inf] ▶ ${message}`);
                ctx.reply(message);
            }
        });

        bot.command('stop', async (ctx) => {
            if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
            || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
                ctx.deleteMessage();
                if (policyCheckJob) policyCheckJob.cancel();
                const message = 'Cron отслеживания полисов остановлен';
                await Logger.log(`[inf] ▶ ${message}`);
                ctx.reply(message);
            }
        });

        bot.command('greetings', async (ctx) => {
            ctx.deleteMessage();
            await spendingTrackerAPI.setToken();
            const response = await spendingTrackerAPI.greetings();
            if (response.data.message) {
                ctx.reply(response.data.message);
            } else {
                ctx.reply(response.data);
            }
        });

        bot.command('update', async (ctx) => {
            ctx.deleteMessage();
            await Logger.log('[inf] ▶ Запущено обновление статусов');
            await this.checkAndNotify(ctx);
        });

        bot.command('verification', async (ctx) => {
            if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
            || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
                ctx.deleteMessage();
                ctx.reply('Меню сверки:', 
                    Markup.inlineKeyboard([
                        [Markup.button.callback('Включить сверку на dev', 'dev_verification_on')],
                        [Markup.button.callback('Отключить сверку на dev', 'dev_verification_off')],
                        [Markup.button.callback('Включить сверку на staging', 'staging_verification_on')],
                        [Markup.button.callback('Отключить сверку на staging', 'staging_verification_off')],
                        [Markup.button.callback('Включить cron на dev', 'dev_verification_cron_on')],
                        [Markup.button.callback('Отключить cron на dev', 'dev_verification_cron_off')],
                        [Markup.button.callback('Включить cron на staging', 'staging_verification_cron_on')],
                        [Markup.button.callback('Отключить cron на staging', 'staging_verification_cron_off')]
                    ])
                );
            }
        });

        bot.action(/(dev|staging)_verification_(on|off)/, async (ctx) => {
            if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
            || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
                ctx.deleteMessage();
                const actionParts = ctx.callbackQuery.data.split('_');
                const env = actionParts.shift();
                const value = actionParts.pop() === 'on';
                await this.toggleVerification(ctx, env, value);
            }
        });

        bot.action(/(dev|staging)_verification_cron_(on|off)/, async (ctx) => {
            if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
            || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
                const actionParts = ctx.callbackQuery.data.split('_');
                const env = actionParts.shift();
                const status = actionParts.pop() === 'on';
                if (status) {
                    ctx.deleteMessage();
                    verificationToggleJob = schedule.scheduleJob(verificationToggleCrontab, async () => {
                        const value = false;
                        await this.toggleVerification(ctx, env, value);
                    });
                    const message = `Cron отключения сверки на ${env} запущен`;
                    await Logger.log(`[inf] ▶ ${message}`);
                    ctx.reply(message);
                } else {
                    ctx.deleteMessage();
                    if (verificationToggleJob) verificationToggleJob.cancel();
                    const message = `Cron отключения сверки на ${env} остановлен`;
                    await Logger.log(`[inf] ▶ ${message}`);
                    ctx.reply(message);
                }
            }
        });

        bot.on(message('text'), async (ctx) => {
            for (const key of Object.keys(BotBase.config.API.endpoints.ESBD.submethods)) {
                if ((ctx.message.text.startsWith(key) 
                && !(JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
                || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id))) 
                || (ctx.message.text.startsWith(`+${key}`) 
                && (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id) 
                || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)))) {
                    await Notion.addPolicy(ctx);
                    ctx.reply('Полис добавлен');
                }
            }
        });
    }
}

export default Handlers;