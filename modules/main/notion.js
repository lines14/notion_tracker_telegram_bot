import Logger from './logger.js';
import BotBase from './botBase.js';
import { Client } from '@notionhq/client';

class Notion {
    static #notion;

	static init() {
		this.#notion = new Client({ auth: BotBase.config.credentials.NOTION_TOKEN });
	}

    static async getNotCancelledPolicies(admin) {
        let results = (await this.#notion.databases.query({ database_id: BotBase.config.credentials.NOTION_DB_ID })).results;
        results = admin 
        ? results.filter((policy) => policy.properties.tracking.status.name === 'Да') 
        : results.filter((policy) => policy.properties.tracking.status.name === 'Нет');
        results = results.filter((policy) => {
            return policy.properties.ones.status.name === 'Выписан'
            || policy.properties.ESBD.status.name === 'Выписан'
            || policy.properties.ones.status.name === 'Статус неизвестен' 
            || policy.properties.ESBD.status.name === 'Статус неизвестен'
            || policy.properties.ESBD.status.name === 'Черновик';
        });

        return results.map((policy) => ({ id: policy.id, number: policy.properties.number.title[0].plain_text }));
    }

    static async updateNotCancelledPolicies(policies, admin) {
        policies.forEach(async (policy) => {
            await this.#notion.pages.update({ 
                page_id: policy.id,
                properties: { 
                    ones: { 
                        status: { 
                            name: admin ? BotBase.config.API.statuses.ones[policy.status.ones] : 'Сброшен',
                            color: admin ? BotBase.config.API.statuses.colors.ones[policy.status.ones] : 'yellow'
                        } 
                    }, 
                    ESBD: { 
                        status: { 
                            name: admin ? BotBase.config.API.statuses.ESBD[policy.status.ESBD] : 'Сброшен',
                            color: admin ? BotBase.config.API.statuses.colors.ESBD[policy.status.ESBD] : 'yellow'
                        } 
                    } 
                }
            });
        });

        await Logger.log('[inf] ▶ Статусы полисов обновлены');
    }

    static async addPolicy(ctx) {
        const policy = ctx.message.text.startsWith('+') 
        ? ctx.message.text.slice(1) 
        : ctx.message.text;
        await this.#notion.pages.create({ 
            parent: { database_id: BotBase.config.credentials.NOTION_DB_ID },
            properties: { 
                number: { title: [{ text: { content: policy } }] },
                tracking: {
                    status: { 
                        name: BotBase.config.adminsID.includes(ctx.from.id) 
                        || BotBase.config.adminsID.includes(ctx.message.chat.id) 
                        ? 'Да' 
                        : 'Нет',
                        color: BotBase.config.adminsID.includes(ctx.from.id) 
                        || BotBase.config.adminsID.includes(ctx.message.chat.id) 
                        ? 'blue' 
                        : 'purple'
                    } 
                }
            }
        });

        await Logger.log(`[inf] ▶ Полис ${policy} добавлен в базу`);
    }
}

export default Notion;