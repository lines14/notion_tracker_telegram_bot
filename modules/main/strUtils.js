class StrUtils {
  static isValidPaymentAmount(str) {
    const num = Number(str);
    return !Number.isNaN(num) && num > 0 && /^\d+(\.\d{1,2})?$/.test(str);
  }
}

export default StrUtils;
