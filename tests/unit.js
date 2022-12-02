import { assert } from '../src/assert.js';

const testExact = (obj, expected, expResult) => {
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

testExact(null, null, true);
testExact(undefined, null, false);
testExact(NaN, null, false);
testExact(123, null, false);

testExact(NaN, NaN, true);
testExact(null, NaN, false);
testExact(undefined, NaN, false);
testExact(123, NaN, false);

testExact(undefined, undefined, true);
testExact(null, undefined, false);
testExact(NaN, undefined, false);
testExact(123, undefined, false);

testExact('', '', true);
testExact(null, '', false);
testExact(undefined, '', false);
testExact(NaN, '', false);
testExact(123, '', false);

testExact('123', '123', true);
testExact(null, '123', false);
testExact(undefined, '123', false);
testExact(NaN, '123', false);
testExact('', '123', false);
testExact(123, '123', false);

testExact(123, 123, true);
testExact(null, 123, false);
testExact(undefined, 123, false);
testExact(NaN, 123, false);
testExact('', 123, false);
testExact('123', 123, false);


testExact([], [], true);
testExact([], [1], false);
testExact([1], [], false);

testExact([1], [1], true);
testExact(
    [1, NaN, null, undefined, '', '123', { a: 1, b: true }],
    [1, NaN, null, undefined, '', '123', { a: 1, b: true }],
    true,
);

testExact({}, {}, true);
testExact({ a: 1 }, {}, false);
testExact({}, { a: 1 }, false);
testExact([123], { a: 1 }, false);
testExact({ a: 1 }, [123], false);

testExact(
    { a: 1, b: [1, 2, 3], c: NaN, d: null, e: undefined, f: '', g: '123', h: { a: 1, b: true } },
    { a: 1, b: [1, 2, 3], c: NaN, d: null, e: undefined, f: '', g: '123', h: { a: 1, b: true } },
    true,
);
