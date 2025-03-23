import dotenv from 'dotenv';
import Logger from './modules/main/logger.js';
import Notion from './modules/main/notion.js';
import BotBase from './modules/main/botBase.js';
import Handlers from './modules/main/handlers.js';

dotenv.config({ override: true });

BotBase.init();
Notion.init();

Handlers.commands(
  BotBase.bot,
  BotBase.config.policyCheckCrontab,
  BotBase.config.verificationToggleCrontab,
);

BotBase.bot.launch({
  webhook: {
    domain: process.env.WEBHOOK_HOST,
    port: Number(process.env.WEBAPP_PORT),
    hookPath: `/${process.env.TG_TOKEN}`,
  },
});

await Logger.log('[inf] ▶ Бот успешно запущен');
