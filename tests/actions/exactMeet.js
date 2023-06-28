import { assert, test } from 'jezve-test';

export const testExactMeet = async (obj, expected, expResult) => {
    await test('assert.exactMeet() method', () => {
        let res = true;

        try {
            assert.exactMeet(obj, expected);
        } catch (e) {
            res = false;
            if (expResult) {
                throw e;
            }
        }

        assert.equal(res, expResult, `Not expected result ${res}`);

        return true;
    });
};
