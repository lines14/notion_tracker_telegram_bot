import Notion from './notion.js';
import { message } from 'telegraf/filters';

class Handlers {
    static handlers(bot) {
        bot.command('start', (ctx) => ctx.reply('Бот успешно запущен!'));
        bot.on(message('text'), async (ctx) => {
            console.log(await Notion.getNewPolicies());
            ctx.reply('Результат в консоли!');
        });
    }
}

export default Handlers;