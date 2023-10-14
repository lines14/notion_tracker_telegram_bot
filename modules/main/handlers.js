import Notion from './notion.js';
import { message } from 'telegraf/filters';

class Handlers {
    static handlers(bot) {
        bot.command('start', (ctx) => ctx.reply('Бот успешно запущен'));

        bot.on(message('text'), async (ctx) => {
            const policies = await Notion.getNotCancelledPolicies();
            await Notion.updateNotCancelledPolicies(policies);
            ctx.reply('Статусы полисов обновлены');
        });
    }
}

export default Handlers;