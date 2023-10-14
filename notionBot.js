import Logger from './modules/main/logger.js';
import Notion from './modules/main/notion.js';
import BotBase from './modules/main/botBase.js';
import Handlers from './modules/main/handlers.js';
import ESBDAPI from './modules/API/ESBDAPI.js';

BotBase.init();
Notion.init();
await ESBDAPI.setToken();

Handlers.handlers(BotBase.bot);

BotBase.bot.launch();
Logger.log('[inf] ▶ Бот успешно запущен');