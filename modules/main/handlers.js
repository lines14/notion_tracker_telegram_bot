import Notion from './notion.js';
import { message } from 'telegraf/filters';
import StatusChecker from './statusChecker.js';

class Handlers {
    static handlers(bot) {
        bot.command('start', (ctx) => ctx.reply('Бот успешно запущен'));

        bot.on(message('text'), async (ctx) => {
            const policies = await Notion.getNotCancelledPolicies();
            const checkedPolicies = await StatusChecker.checkESBD(policies);
            await Notion.updateNotCancelledPolicies(checkedPolicies);
            ctx.reply('Статусы полисов обновлены');
        });
    }
}

export default Handlers;