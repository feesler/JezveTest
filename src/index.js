export { TestView } from './view/TestView.js';
export { TestComponent } from './view/TestComponent.js';
export { Runner } from './Runner.js';
export { TestApplication } from './TestApplication.js';
export * from './utils.js';
export * from './assert.js';

let testEnv = null;

export function setupTest(env) {
    if (!env) {
        throw new Error('Invalid environment specified');
    }

    testEnv = env;
}

export function getEnv() {
    return testEnv;
}

/**
 * Run action and add result to the list
 * @param {string} descr - description of test
 * @param {Function} action - action function
 */
export async function test(descr, action) {
    try {
        const res = await action();

        testEnv.addResult(descr, res);
    } catch (e) {
        const extError = (e instanceof Error) ? e : new Error(e);
        extError.descr = descr;
        throw extError;
    }
}
