import dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import Logger from './logger.js';
import BotBase from './botBase.js';

dotenv.config({ override: true });

class Notion {
  static #notion;

  static init() {
    this.#notion = new Client({ auth: process.env.NOTION_TOKEN });
  }

  static async queryAll() {
    let cursor;
    let hasMore;
    const allResults = [];

    do { // eslint-disable-next-line no-await-in-loop
      const response = await this.#notion.databases.query({
        database_id: process.env.NOTION_DB_ID,
        start_cursor: cursor,
      });

      allResults.push(...response.results);
      hasMore = response.has_more;
      cursor = response.next_cursor;
    } while (hasMore);

    return allResults;
  }

  static async getNotCancelledPolicies(admin) {
    let results = await this.queryAll();
    results = admin
      ? results.filter((policy) => policy.properties.tracking.status.name === 'Да')
      : results.filter((policy) => policy.properties.tracking.status.name === 'Нет');
    results = results.filter((policy) => policy.properties.ones.status.name === 'Выписан'
    || policy.properties.ESBD.status.name === 'Выписан'
    || policy.properties.ones.status.name === 'Статус неизвестен'
    || policy.properties.ESBD.status.name === 'Статус неизвестен'
    || policy.properties.ESBD.status.name === 'Черновик');

    return results.map((policy) => ({
      id: policy.id,
      number: policy.properties.number.title[0].plain_text,
    }));
  }

  static async updateNotCancelledPolicies(policies, admin) {
    policies.forEach(async (policy) => {
      await this.#notion.pages.update({
        page_id: policy.id,
        properties: {
          ones: {
            status: {
              name: admin ? BotBase.config.API.statuses.ones[policy.status.ones] : 'Сброшен',
              color: admin ? BotBase.config.API.statuses.colors.ones[policy.status.ones] : 'yellow',
            },
          },
          ESBD: {
            status: {
              name: admin ? BotBase.config.API.statuses.ESBD[policy.status.ESBD] : 'Сброшен',
              color: admin ? BotBase.config.API.statuses.colors.ESBD[policy.status.ESBD] : 'yellow',
            },
          },
        },
      });
    });

    await Logger.log('[inf] ▶ Статусы полисов обновлены');
  }

  static async addPolicy(ctx) {
    const policy = ctx.message.text.startsWith('+')
      ? ctx.message.text.slice(1)
      : ctx.message.text;
    await this.#notion.pages.create({
      parent: { database_id: process.env.NOTION_DB_ID },
      properties: {
        number: { title: [{ text: { content: policy } }] },
        tracking: {
          status: {
            name: JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
            || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)
              ? 'Да'
              : 'Нет',
            color: JSON.parse(process.env.ADMINS_IDS).includes(ctx.from.id)
            || JSON.parse(process.env.ADMINS_IDS).includes(ctx.message.chat.id)
              ? 'blue'
              : 'purple',
          },
        },
      },
    });

    await Logger.log(`[inf] ▶ Полис ${policy} добавлен в базу`);
  }
}

export default Notion;
