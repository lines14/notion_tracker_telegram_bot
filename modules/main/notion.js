import BotBase from './botBase.js';
import { Client } from '@notionhq/client';

class Notion {
    static #notion;

	static init() {
		this.#notion = new Client({ auth: BotBase.config.NOTION_TOKEN });
	}

    static async getNewPolicies() {
        const response = await this.#notion.databases.query({ database_id: BotBase.config.NOTION_DB_ID });
        // const filtered = response.results.filter((element) => !element.properties.DTA.rich_text[0].text.content 
        // || !element.properties.ESBD.rich_text[0].text.content);
        // return filtered.map((element) => element.properties.number.title[0].plain_text);
        return response.results.map((element) => element.properties.DTA.rich_text[0]?.plain_text);
    }
}

export default Notion;