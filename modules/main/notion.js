import Logger from './logger.js';
import BotBase from './botBase.js';
import { Client } from '@notionhq/client';

class Notion {
    static #notion;

	static init() {
		this.#notion = new Client({ auth: BotBase.config.credentials.NOTION_TOKEN });
	}

    static async getNotCancelledPolicies() {
        const response = await this.#notion.databases.query({ database_id: BotBase.config.credentials.NOTION_DB_ID });
        const filtered = response.results.filter((policy) => {
            return !policy.properties.ones.rich_text[0]?.plain_text 
            || !policy.properties.ESBD.rich_text[0]?.plain_text
            || policy.properties.ones.rich_text[0]?.plain_text === 'Выписан' 
            || policy.properties.ESBD.rich_text[0]?.plain_text === 'Выписан';
        });

        return filtered.map((policy) => ({ id: policy.id, number: policy.properties.number.title[0].plain_text }));
    }

    static async updateNotCancelledPolicies(policies) {
        policies.forEach(async (policy) => {
            await this.#notion.pages.update({ 
                page_id: policy.id,
                properties: { 
                    ones: { rich_text: [{ text: { content: BotBase.config.API.statuses.ones[policy.status.ones ? policy.status.ones : '6'] } }] }, 
                    ESBD: { rich_text: [{ text: { content: BotBase.config.API.statuses.ESBD[policy.status.ESBD] } }] } 
                }
            });
        });

        Logger.log('[inf] ▶ Статусы полисов обновлены')
    }
}

export default Notion;