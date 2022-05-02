import { isObject } from './utils.js';

export const assert = {
    /**
     * Check index is valid for specified array
     * @param {Array} arr
     * @param {Number} ind
     * @param {String|null} message
     */
    arrayIndex: (arr, ind, message = null) => {
        if (!Array.isArray(arr)) {
            throw new Error('Invalid array');
        }

        if (Number.isNaN(ind) || ind < 0 || ind >= arr.length) {
            const msg = (message === null) ? `Invalid index: ${ind}` : message;
            throw new Error(msg);
        }
    },

    /**
    * Compare object with expected
    * @param {Object} obj
    * @param {Object} expectedObj
    * @param {boolean} ret - return or throw
    */
    deepMeet(obj, expectedObj, ret = false) {
        let res = true;

        // undefined means no care
        if (typeof expectedObj === 'undefined') {
            return true;
        }

        if (!isObject(expectedObj) && !Array.isArray(expectedObj)) {
            if (obj === expectedObj) {
                return true;
            }

            if (ret) {
                return {
                    key: '',
                    value: obj,
                    expected: expectedObj,
                };
            }

            throw new Error(`Not expected value "${obj}", "${expectedObj}" is expected`);
        }

        if (obj === expectedObj) {
            return true;
        }

        let value;
        let expected;
        const expectedKeys = Object.getOwnPropertyNames(expectedObj);
        for (const vKey of expectedKeys) {
            if (obj === null || !(vKey in obj)) {
                res = { key: vKey };
                break;
            }

            expected = expectedObj[vKey];
            value = obj[vKey];
            if (isObject(expected) || Array.isArray(expected)) {
                res = this.deepMeet(value, expected, true);
                if (res !== true) {
                    res.key = `${vKey}.${res.key}`;
                    break;
                }
            } else if (value !== expected) {
                res = {
                    key: vKey,
                    value,
                    expected,
                };
                break;
            }
        }

        if (res !== true && !ret) {
            if ('expected' in res) {
                throw new Error(`Not expected value "${res.value}" for (${res.key}) "${res.expected}" is expected`);
            } else {
                throw new Error(`Path (${res.key}) not found`);
            }
        }

        return res;
    },
};
