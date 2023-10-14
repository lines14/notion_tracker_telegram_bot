import moment from 'moment';
import BotBase from './botBase.js';

class Logger {
    static log(step) {
        const timeStamp = moment().format().slice(0, 19).replace('T', ' ');
        if (BotBase.config.hiddenLogBodies && step.includes('[req]')) {
            const words = step.split(' ');
            const firstPart = words.slice(0, 3).join(' ');
            const secondPart = words.slice(words.length - 2).join(' ');
            console.log(`${timeStamp} ${firstPart} ${secondPart}`);
        } else {
            console.log(`${timeStamp} ${step}`);
        }
    }
}

export default Logger;