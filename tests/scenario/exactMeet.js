import { setBlock } from 'jezve-test';
import { testExactMeet } from '../actions/exactMeet.js';
import { App } from '../app.js';

export const exactMeetTests = async () => {
    setBlock('assert.exactMeet() method', 1);

    const data = [
        [null, null, true],
        [undefined, null, false],
        [NaN, null, false],
        [123, null, false],

        [NaN, NaN, true],
        [null, NaN, false],
        [undefined, NaN, false],
        [123, NaN, false],

        [undefined, undefined, true],
        [null, undefined, false],
        [NaN, undefined, false],
        [123, undefined, false],

        ['', '', true],
        [null, '', false],
        [undefined, '', false],
        [NaN, '', false],
        [123, '', false],

        ['123', '123', true],
        [null, '123', false],
        [undefined, '123', false],
        [NaN, '123', false],
        ['', '123', false],
        [123, '123', false],

        [123, 123, true],
        [null, 123, false],
        [undefined, 123, false],
        [NaN, 123, false],
        ['', 123, false],
        ['123', 123, false],

        [[], [], true],
        [[], [1], false],
        [[1], [], false],

        [[1], [1], true],
        [
            [1, NaN, null, undefined, '', '123', { a: 1, b: true }],
            [1, NaN, null, undefined, '', '123', { a: 1, b: true }],
            true,
        ],

        [{}, {}, true],
        [{ a: 1 }, {}, false],
        [{}, { a: 1 }, false],
        [[123], { a: 1 }, false],
        [{ a: 1 }, [123], false],

        [
            { a: 1, b: [1, 2, 3], c: NaN, d: null, e: undefined, f: '', g: '123', h: { a: 1, b: true } },
            { a: 1, b: [1, 2, 3], c: NaN, d: null, e: undefined, f: '', g: '123', h: { a: 1, b: true } },
            true,
        ],
    ];

    await App.scenario.runner.runGroup((item) => testExactMeet(...item), data);
};
