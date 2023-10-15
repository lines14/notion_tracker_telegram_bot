import Logger from './modules/main/logger.js';
import Notion from './modules/main/notion.js';
import BotBase from './modules/main/botBase.js';
import Handlers from './modules/main/handlers.js';
import onesAPI from './modules/API/onesAPI.js';
import ESBDAPI from './modules/API/ESBDAPI.js';

BotBase.init();
Notion.init();
await onesAPI.setToken();
await ESBDAPI.setToken();

Handlers.commands(BotBase.bot);

bot.launch({ 
    webhook: { 
        domain: `https://${BotBase.config.credentials.WEBHOOK_HOST}/${BotBase.config.credentials.TG_TOKEN}`, 
        port: Number(BotBase.config.credentials.WEBAPP_PORT) 
    } 
});
Logger.log('[inf] ▶ Бот успешно запущен');