/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint no-restricted-syntax: ['off', 'ForInStatement'] */
import dotenv from 'dotenv';
import schedule from 'node-schedule';
import { message } from 'telegraf/filters';
import Notion from './notion.js';
import Logger from './logger.js';
import BotBase from './botBase.js';
import DataUtils from './dataUtils.js';
import Keyboards from './keyboards.js';
import KaspiAPI from '../API/kaspiAPI.js';
import StatesGroup from './statesGroup.js';
import StatusChecker from './statusChecker.js';
import DictionaryAPI from '../API/dictionaryAPI.js';

dotenv.config({ override: true });
const paymentStatesGroup = StatesGroup.from(
  'payment1',
);

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

  static async checkSumAndPayForPolicy(ctx) {
    let msg;
    const fullPaidSubstr = 'полностью оплачен';
    let stateData = paymentStatesGroup.getData(ctx.from.id);
    const { env } = stateData;

    await KaspiAPI.setToken({ env });
    let response = await KaspiAPI.check(stateData);
    let JSONResponse = await DataUtils.XMLToJSON(response.data);
    const responseWithNamedFields = Object.fromEntries(Object
      .values(JSONResponse.fields).map(({ _, name }) => [name, _]));

    if (responseWithNamedFields.Amount) {
      paymentStatesGroup.setData(
        ctx.from.id,
        'sum',
        parseFloat(responseWithNamedFields.Amount).toString(),
      );
      stateData = paymentStatesGroup.getData(ctx.from.id);
      response = await KaspiAPI.pay(stateData);
      JSONResponse = await DataUtils.XMLToJSON(response.data);

      msg = JSONResponse.comment.includes(fullPaidSubstr)
      || JSONResponse.comment.includes('принят')
        ? `Полис с номером/кодом ${stateData.account} оплачен на сумму ${responseWithNamedFields.Amount} на ${env}`
        : `Ошибка при оплате полиса ${stateData.account} на ${env}: ${JSONResponse.comment}`;
    } else {
      msg = responseWithNamedFields.message.includes(fullPaidSubstr)
        ? `Полис с номером/кодом ${stateData.account} был ранее оплачен на ${env}`
        : `Ошибка при оплате полиса ${stateData.account} на ${env}: ${responseWithNamedFields.message}`;
    }

    await Logger.log(`[inf] ▶ ${msg}`);
    ctx.reply(msg);
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

    const SDTitle = 'Полисы на PROD:';
    const QATitle = 'Тестовые полисы на PROD:';
    let notification = JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
    || JSON.parse(process.env.ADMINS_IDS).includes(chatID)
      ? QATitle
      : SDTitle;

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

    if (notification === QATitle) notification = 'Выписанных тестовых полисов на PROD нет';
    if (notification === SDTitle) notification = '❌ Выписанных полисов на PROD нет\n(список проверяемых полисов был очищен, добавьте другие или прежние повторно)';

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

    bot.command('policies', async (ctx) => {
      ctx.deleteMessage();
      if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
      || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
        ctx.reply('Меню отслеживания статусов полисов:', Keyboards.adminsPoliciesKeyboard);
      } else {
        ctx.reply('Меню отслеживания статусов полисов:', Keyboards.policiesKeyboard);
      }
    });

    bot.command('payments', async (ctx) => {
      if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
      || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)) {
        ctx.deleteMessage();
        ctx.reply('Меню тестовых платежей:', Keyboards.paymentsKeyboard);
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

    bot.action(/(dev|staging)_pay_for_policy/, async (ctx) => {
      if (JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
      || JSON.parse(process.env.ADMINS_IDS).includes(ctx.callbackQuery.message.chat.id)) {
        ctx.deleteMessage();
        const actionParts = ctx.callbackQuery.data.split('_');
        const env = actionParts.shift();
        paymentStatesGroup.clear(ctx.from.id);
        paymentStatesGroup.start(ctx.from.id);
        paymentStatesGroup.setData(ctx.from.id, 'env', env);
        ctx.reply('Введите код оплаты или номер полиса, который требуется оплатить');
      }
    });

    bot.on(message('text'), async (ctx) => {
      const admins = JSON.parse(process.env.ADMINS_IDS);
      const state = paymentStatesGroup.getState(ctx.from.id);
      const isAdmin = admins.includes(ctx.from.id) || admins.includes(ctx.message.chat.id);
      const keys = Object.keys(BotBase.config.API.endpoints.ESBD.submethods);

      if ((keys.some((key) => ctx.message.text.startsWith(key)) && !isAdmin)
        || (keys.some((key) => ctx.message.text.startsWith(`+${key}`)) && isAdmin)) {
        paymentStatesGroup.clear(ctx.from.id);
        const policy = ctx.message.text.startsWith('+')
          ? ctx.message.text.slice(1)
          : ctx.message.text;
        await Notion.addPolicy(ctx, policy); // eslint-disable-line no-await-in-loop
        ctx.reply(`Полис ${policy} добавлен в базу отслеживания`);
      } else if ((keys.some((key) => ctx.message.text.startsWith(key))
        && state === paymentStatesGroup.payment1
        && isAdmin)
        || (/^[A-Z0-9]{6}$/.test(ctx.message.text)
        && state === paymentStatesGroup.payment1
        && isAdmin)) {
        paymentStatesGroup.setData(ctx.from.id, 'account', ctx.message.text);
        await this.checkSumAndPayForPolicy(ctx);
        paymentStatesGroup.clear(ctx.from.id);
      }
    });
  }
}

export default Handlers;
