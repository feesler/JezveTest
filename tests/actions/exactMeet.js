import { assert } from '../../src/assert.js';

export const testExactMeet = (obj, expected, expResult) => {
    let res = true;
    try {
        assert.exactMeet(obj, expected);
    } catch (e) {
        res = false;
    }

    if (res !== expResult) {
        console.log('FAIL res: ', res, ' expResult: ', expResult);
    } else {
        console.log('OK res: ', res, ' expResult: ', expResult);
    }
};
