import {
    isObject,
    isFunction,
    isDate,
    isNum,
    isInt,
} from './utils.js';

const MSG_ASSERT = 'Expression is not true';
const MSG_IS_ARRAY = 'Value is not array';
const MSG_IS_OBJECT = 'Value is not Object';
const MSG_IS_FUNCTION = 'Value is not function';
const MSG_IS_DATE = 'Value is not Date';
const MSG_IS_NUMBER = 'Value is not number';
const MSG_IS_INTEGER = 'Value is not integer';

/** Throws exception if expression is not thuthy */
export const assert = (condition, message = MSG_ASSERT) => {
    if (!condition) {
        throw new Error(message);
    }
};

/**
 * Throws exception if object is not array
 * @param {Array} obj - object to check
 * @param {String|null} message - optional error message
 */
assert.isArray = (obj, message = MSG_IS_ARRAY) => {
    if (!Array.isArray(obj)) {
        throw new Error(message);
    }
};

/**
 * Throws exception if object is not object
 * @param {Array} obj - object to check
 * @param {String|null} message - optional error message
 */
assert.isObject = (obj, message = MSG_IS_OBJECT) => {
    if (!isObject(obj)) {
        throw new Error(message);
    }
};

/**
 * Throws exception if object is not function
 * @param {Array} obj - object to check
 * @param {String|null} message - optional error message
 */
assert.isFunction = (obj, message = MSG_IS_FUNCTION) => {
    if (!isFunction(obj)) {
        throw new Error(message);
    }
};

/**
 * Throws exception if object is not Date
 * @param {Array} obj - object to check
 * @param {String|null} message - optional error message
 */
assert.isDate = (obj, message = MSG_IS_DATE) => {
    if (!isDate(obj)) {
        throw new Error(message);
    }
};

/**
 * Throws exception if object is not number
 * @param {Array} obj - object to check
 * @param {String|null} message - optional error message
 */
assert.isNumber = (obj, message = MSG_IS_NUMBER) => {
    if (!isNum(obj)) {
        throw new Error(message);
    }
};

/**
 * Throws exception if object is not integer number
 * @param {Array} obj - object to check
 * @param {String|null} message - optional error message
 */
assert.isInteger = (obj, message = MSG_IS_INTEGER) => {
    if (!isInt(obj)) {
        throw new Error(message);
    }
};

/**
 * Check index is valid for specified array
 * @param {Array} arr
 * @param {Number} ind
 * @param {String|null} message
 */
assert.arrayIndex = (arr, ind, message = null) => {
    if (!Array.isArray(arr)) {
        throw new Error('Invalid array');
    }

    if (Number.isNaN(ind) || ind < 0 || ind >= arr.length) {
        const msg = (message === null) ? `Invalid index: ${ind}` : message;
        throw new Error(msg);
    }
};

/**
 * Compare object with expected
 * @param {Object} obj
 * @param {Object} expectedObj
 * @param {boolean} ret - return or throw
 */
assert.deepMeet = (obj, expectedObj, ret = false) => {
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
};
