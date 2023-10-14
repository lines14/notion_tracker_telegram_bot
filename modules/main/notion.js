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
        const filtered = response.results.filter((element) => {
            return !element.properties.DTA.rich_text[0]?.plain_text 
            || !element.properties.ESBD.rich_text[0]?.plain_text
            || element.properties.DTA.rich_text[0]?.plain_text === 'Выписан' 
            || element.properties.ESBD.rich_text[0]?.plain_text === 'Выписан';
        });

        return filtered.map((element) => ({ id: element.id, text: element.properties.number.title[0].plain_text }));
    }

    static async updateNotCancelledPolicies(elements) {
        elements.forEach(async (element) => {
            await this.#notion.pages.update({ 
                page_id: element.id,
                properties: { 
                    DTA: { rich_text: [{ text: { content: 'kek' } }] }, 
                    ESBD: { rich_text: [{ text: { content: 'kek' } }] } 
                }
            });
        });

        Logger.log('[inf] ▶ Статусы полисов обновлены')
    }
}

export default Notion;