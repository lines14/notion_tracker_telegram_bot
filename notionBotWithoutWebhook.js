import Logger from './modules/main/logger.js';
import Notion from './modules/main/notion.js';
import BotBase from './modules/main/botBase.js';
import Handlers from './modules/main/handlers.js';

BotBase.init();
Notion.init();

Handlers.commands(BotBase.bot);

BotBase.bot.launch();
Logger.log('[inf] ▶ Бот успешно запущен');