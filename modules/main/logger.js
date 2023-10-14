import dotenv from 'dotenv';
import moment from 'moment';
dotenv.config({ override: true });

class Logger {
    static log(step) {
        const timeStamp = moment().format().slice(0, 19).replace('T', ' ');
        if (process.env.HIDDEN_LOG_BODIES && step.includes('[req]')) {
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