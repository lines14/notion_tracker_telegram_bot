import { parseStringPromise } from 'xml2js';

class DataUtils {
  static async XMLToJSON(xml) {
    return (await parseStringPromise(xml, {
      explicitArray: false,
      explicitCharkey: false,
      trim: true,
      mergeAttrs: true,
    })).response;
  }
}

export default DataUtils;
