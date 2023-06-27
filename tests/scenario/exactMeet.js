import { testExactMeet } from '../actions/exactMeet.js';

export const exactMeetTests = () => {
    testExactMeet(null, null, true);
    testExactMeet(undefined, null, false);
    testExactMeet(NaN, null, false);
    testExactMeet(123, null, false);

    testExactMeet(NaN, NaN, true);
    testExactMeet(null, NaN, false);
    testExactMeet(undefined, NaN, false);
    testExactMeet(123, NaN, false);

    testExactMeet(undefined, undefined, true);
    testExactMeet(null, undefined, false);
    testExactMeet(NaN, undefined, false);
    testExactMeet(123, undefined, false);

    testExactMeet('', '', true);
    testExactMeet(null, '', false);
    testExactMeet(undefined, '', false);
    testExactMeet(NaN, '', false);
    testExactMeet(123, '', false);

    testExactMeet('123', '123', true);
    testExactMeet(null, '123', false);
    testExactMeet(undefined, '123', false);
    testExactMeet(NaN, '123', false);
    testExactMeet('', '123', false);
    testExactMeet(123, '123', false);

    testExactMeet(123, 123, true);
    testExactMeet(null, 123, false);
    testExactMeet(undefined, 123, false);
    testExactMeet(NaN, 123, false);
    testExactMeet('', 123, false);
    testExactMeet('123', 123, false);

    testExactMeet([], [], true);
    testExactMeet([], [1], false);
    testExactMeet([1], [], false);

    testExactMeet([1], [1], true);
    testExactMeet(
        [1, NaN, null, undefined, '', '123', { a: 1, b: true }],
        [1, NaN, null, undefined, '', '123', { a: 1, b: true }],
        true,
    );

    testExactMeet({}, {}, true);
    testExactMeet({ a: 1 }, {}, false);
    testExactMeet({}, { a: 1 }, false);
    testExactMeet([123], { a: 1 }, false);
    testExactMeet({ a: 1 }, [123], false);

    testExactMeet(
        { a: 1, b: [1, 2, 3], c: NaN, d: null, e: undefined, f: '', g: '123', h: { a: 1, b: true } },
        { a: 1, b: [1, 2, 3], c: NaN, d: null, e: undefined, f: '', g: '123', h: { a: 1, b: true } },
        true,
    );
};
