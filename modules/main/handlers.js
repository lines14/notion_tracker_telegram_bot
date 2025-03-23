/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint no-restricted-syntax: ['off', 'ForInStatement'] */
import dotenv from 'dotenv';
import schedule from 'node-schedule';
import { message } from 'telegraf/filters';
import Notion from './notion.js';
import Logger from './logger.js';
import BotBase from './botBase.js';
import Keyboards from './keyboards.js';
import StatusChecker from './statusChecker.js';
import DictionaryAPI from '../API/dictionaryAPI.js';
import spendingTrackerAPI from '../API/spendingTrackerAPI.js';

dotenv.config({ override: true });

class Handlers {
  static async toggleVerification(ctx, env, value, options = { fromCrontab: false }) {
    const dictionaryAPI = new DictionaryAPI();
    await dictionaryAPI.setToken({ env });
    await dictionaryAPI.toggleServer();
    await dictionaryAPI.toggleVerification({ value });
    const statusText = value ? 'включена' : 'отключена';
    const msg = `Сверка на ${env} ${statusText}`;
    await Logger.log(`[inf] ▶ ${msg}`);
    if (!options.fromCrontab) {
      ctx.reply(msg);
    }
  }

  static async checkAndNotify(ctx) {
    const chatID = ctx.message?.chat?.id || ctx.callbackQuery?.message?.chat?.id;
    let policies = await Notion.getNotCancelledPolicies(JSON.parse(process.env.ADMINS_IDS)
      .includes(ctx.from.id)
        || JSON.parse(process.env.ADMINS_IDS).includes(chatID));
    policies = await StatusChecker.getStatusESBD(policies);
    policies = await StatusChecker.getStatusOnes(policies);
    await Notion.updateNotCancelledPolicies(policies, JSON.parse(process.env.ADMINS_IDS)
      .includes(ctx.from.id)
        || JSON.parse(process.env.ADMINS_IDS).includes(chatID));

    const issuedOnesKeys = Object.keys(BotBase.config.API.statuses.ones)
      .filter((key) => BotBase.config.API.statuses.ones[key] === 'Выписан').map(Number);
    const issuedESBDKeys = Object.keys(BotBase.config.API.statuses.ESBD)
      .filter((key) => BotBase.config.API.statuses.ESBD[key] === 'Выписан').map(Number);

    let notification = JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
    || JSON.parse(process.env.ADMINS_IDS).includes(chatID)
      ? 'Тестовые полисы на PROD:'
      : 'Полисы на PROD:';

    policies.forEach((policy) => {
      policy.notifications = [];
      if (policy.status.ones === 'default') policy.notifications.push('\n❓статус 1С неизвестен');
      if (policy.status.ESBD === 'default') policy.notifications.push('\n❓статус ЕСБД неизвестен');
      if (issuedOnesKeys.includes(policy.status.ones)) {
        policy.notifications.push(JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
        || JSON.parse(process.env.ADMINS_IDS).includes(chatID)
          ? '\n❗не отменён в 1С'
          : '\n✅ выписан в 1С');
      }

      if (issuedESBDKeys.includes(policy.status.ESBD)) {
        policy.notifications.push(JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
        || JSON.parse(process.env.ADMINS_IDS).includes(chatID)
          ? '\n❗не отменён в ЕСБД'
          : '\n✅ выписан в ЕСБД');
      }

      if (policy.status.ESBD === 'Черновик') policy.notifications.push('\n📌черновик в ЕСБД');

      if (policy.notifications.length !== 0) {
        policy.notifications.unshift(`\n\n${policy.number}:`);
        policy.notifications.forEach((msg) => { notification += msg; });
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

    bot.command('update', async (ctx) => {
      ctx.deleteMessage();
      await Logger.log('[inf] ▶ Запущено обновление статусов полисов');
      await this.checkAndNotify(ctx);
    });

    bot.command('run', async (ctx) => {
      if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
      || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
        ctx.deleteMessage();
        policyCheckJob = schedule.scheduleJob(policyCheckCrontab, async () => {
          await Logger.log('[inf] ▶ Запущено обновление статусов полисов');
          await this.checkAndNotify(ctx);
        });
        const msg = 'Cron отслеживания статусов полисов запущен';
        await Logger.log(`[inf] ▶ ${msg}`);
        ctx.reply(msg);
      }
    });

    bot.command('stop', async (ctx) => {
      if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
      || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
        ctx.deleteMessage();
        if (policyCheckJob) policyCheckJob.cancel();
        const msg = 'Cron отслеживания статусов полисов остановлен';
        await Logger.log(`[inf] ▶ ${msg}`);
        ctx.reply(msg);
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

    bot.command('policies', async (ctx) => {
      ctx.deleteMessage();
      if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
      || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
        ctx.reply('Меню отслеживания статусов полисов:', Keyboards.adminsPoliciesKeyboard);
      } else {
        ctx.reply('Меню отслеживания статусов полисов:', Keyboards.policiesKeyboard);
      }
    });

    bot.command('verification', async (ctx) => {
      if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
      || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
        ctx.deleteMessage();
        ctx.reply('Меню сверки:', Keyboards.verificationKeyboard);
      }
    });

    bot.action('update_policies_statuses', async (ctx) => {
      ctx.deleteMessage();
      await Logger.log('[inf] ▶ Запущено обновление статусов полисов');
      await this.checkAndNotify(ctx);
    });

    bot.action(/update_policies_statuses_cron_(on|off)/, async (ctx) => {
      if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
      || JSON.parse(process.env.ADMINS_IDS).includes(ctx.callbackQuery.message.chat.id)) {
        const actionParts = ctx.callbackQuery.data.split('_');
        const status = actionParts.pop() === 'on';
        if (status) {
          ctx.deleteMessage();
          policyCheckJob = schedule.scheduleJob(policyCheckCrontab, async () => {
            await Logger.log('[inf] ▶ Запущено обновление статусов полисов');
            await this.checkAndNotify(ctx);
          });
          const msg = 'Cron отслеживания статусов полисов запущен';
          await Logger.log(`[inf] ▶ ${msg}`);
          ctx.reply(msg);
        } else {
          ctx.deleteMessage();
          if (policyCheckJob) policyCheckJob.cancel();
          const msg = 'Cron отслеживания статусов полисов остановлен';
          await Logger.log(`[inf] ▶ ${msg}`);
          ctx.reply(msg);
        }
      }
    });

    bot.action(/(dev|staging)_verification_(on|off)/, async (ctx) => {
      if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
      || JSON.parse(process.env.ADMINS_IDS).includes(ctx.callbackQuery.message.chat.id)) {
        ctx.deleteMessage();
        const actionParts = ctx.callbackQuery.data.split('_');
        const env = actionParts.shift();
        const value = actionParts.pop() === 'on';
        await this.toggleVerification(ctx, env, value);
      }
    });

    bot.action(/(dev|staging)_verification_cron_(on|off)/, async (ctx) => {
      if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
      || JSON.parse(process.env.ADMINS_IDS).includes(ctx.callbackQuery.message.chat.id)) {
        const actionParts = ctx.callbackQuery.data.split('_');
        const env = actionParts.shift();
        const status = actionParts.pop() === 'on';
        if (status) {
          ctx.deleteMessage();
          verificationToggleJob = schedule.scheduleJob(verificationToggleCrontab, async () => {
            const value = false;
            await this.toggleVerification(ctx, env, value, { fromCrontab: true });
          });
          const msg = `Cron отключения сверки на ${env} запущен`;
          await Logger.log(`[inf] ▶ ${msg}`);
          ctx.reply(msg);
        } else {
          ctx.deleteMessage();
          if (verificationToggleJob) verificationToggleJob.cancel();
          const msg = `Cron отключения сверки на ${env} остановлен`;
          await Logger.log(`[inf] ▶ ${msg}`);
          ctx.reply(msg);
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
          await Notion.addPolicy(ctx); // eslint-disable-line no-await-in-loop
          ctx.reply('Полис добавлен');
        }
      }
    });
  }
}

export default Handlers;
