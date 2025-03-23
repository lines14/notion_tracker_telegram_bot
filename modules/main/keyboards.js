import { Markup } from 'telegraf';

class Keyboards {
  static #b1 = Markup.button.callback('Обновить статусы полисов', 'update_policies_statuses');

  static #b2 = Markup.button.callback('Включить cron обновления статусов полисов', 'update_policies_statuses_cron_on');

  static #b3 = Markup.button.callback('Отключить cron обновления статусов полисов', 'update_policies_statuses_cron_off');

  static #b4 = Markup.button.callback('Включить сверку на dev', 'dev_verification_on');

  static #b5 = Markup.button.callback('Отключить сверку на dev', 'dev_verification_off');

  static #b6 = Markup.button.callback('Включить сверку на staging', 'staging_verification_on');

  static #b7 = Markup.button.callback('Отключить сверку на staging', 'staging_verification_off');

  static #b8 = Markup.button.callback('Включить cron отключения сверки на dev', 'dev_verification_cron_on');

  static #b9 = Markup.button.callback('Отключить cron отключения сверки на dev', 'dev_verification_cron_off');

  static #b10 = Markup.button.callback('Включить cron отключения сверки на staging', 'staging_verification_cron_on');

  static #b11 = Markup.button.callback('Отключить cron отключения сверки на staging', 'staging_verification_cron_off');

  static get adminsPoliciesKeyboard() {
    return Markup.inlineKeyboard([[this.#b1], [this.#b2], [this.#b3]]);
  }

  static get policiesKeyboard() {
    return Markup.inlineKeyboard([[this.#b1]]);
  }

  static get verificationKeyboard() {
    return Markup.inlineKeyboard([[this.#b4], [this.#b5], [this.#b6], [this.#b7],
      [this.#b8], [this.#b9], [this.#b10], [this.#b11]]);
  }
}

export default Keyboards;
