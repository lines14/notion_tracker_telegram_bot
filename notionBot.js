import Notion from './modules/notion.js';
import BotBase from './modules/botBase.js';
import Handlers from './modules/handlers.js';

BotBase.init();
Notion.init();
Handlers.handlers(BotBase.bot);
BotBase.bot.launch();
console.log('Бот успешно запущен!');