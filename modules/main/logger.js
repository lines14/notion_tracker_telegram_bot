import path from 'path';
import dotenv from 'dotenv';
import moment from 'moment';
import { filesize } from 'filesize';
import { stat, promises as fsPromises } from 'fs';

dotenv.config({ override: true });
const filePath = path.join(path.resolve(), 'log.txt');

class Logger {
  static async log(step) {
    const timeStamp = moment().format().slice(0, 19).replace('T', ' ');
    await fsPromises.appendFile(filePath, `${timeStamp} ${step}\n`);
    await this.hideLogBodies(step);
    await this.autoclearLog();
  }

  static async hideLogBodies(step) {
    if (process.env.HIDDEN_LOG_BODIES && step.includes('[req]')) {
      const words = step.split(' ');
      const firstPart = words.slice(0, 3).join(' ');
      const secondPart = words.slice(words.length - 2).join(' ');
      console.log(`  ${firstPart} ${secondPart}`); // eslint-disable-line no-console
    } else {
      console.log(`  ${step}`); // eslint-disable-line no-console
    }
  }

  static async autoclearLog() {
    stat(filePath, async (err, stats) => {
      const logSize = stats.size / (1024 * 1024);
      if (logSize > process.env.LOG_MAX_SIZE_MEGABYTES) {
        await fsPromises.writeFile(filePath, '');
        await this.log(`[inf] ▶ Файл лога очищен из-за превышения лимита занимаемой памяти (${filesize(logSize)})`);
      }
    });
  }
}

export default Logger;
