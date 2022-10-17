export { TestView } from './view/TestView.js';
export { TestComponent } from './view/TestComponent.js';
export { Runner } from './Runner.js';
export { TestApplication } from './TestApplication.js';
export { TestStory } from './TestStory.js';
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

export const baseUrl = () => testEnv.baseUrl();

export const url = () => testEnv.url();

export const isFullScenario = () => testEnv.isFullScenario();

export const navigation = (action) => testEnv.navigation(action);

export const setErrorHandler = () => testEnv.setErrorHandler();

export const goTo = (link) => testEnv.goTo(link);

export const parentNode = (elem) => testEnv.parentNode(elem);

export const query = (...args) => testEnv.query(...args);

export const queryAll = (...args) => testEnv.queryAll(...args);

export const closest = (elem, selector) => testEnv.closest(elem, selector);

export const hasClass = (elem, className) => testEnv.hasClass(elem, className);

export const isVisible = (elem, recursive) => testEnv.isVisible(elem, recursive);

export const select = (elem, value, bool) => testEnv.select(elem, value, bool);

export const check = (elem) => testEnv.check(elem);

export const onChange = (elem) => testEnv.onChange(elem);

export const onBlur = (elem) => testEnv.onBlur(elem);

export const prop = (elem, property) => testEnv.prop(elem, property);

export const attr = (elem, attribute) => testEnv.attr(elem, attribute);

export const waitForSelector = (selector, options) => (
    testEnv.waitForSelector(selector, options)
);

export const waitForFunction = (condition, options) => (
    testEnv.waitForFunction(condition, options)
);

export const wait = (condition, options) => testEnv.wait(condition, options);

export const timeout = (ms) => testEnv.timeout(ms);

export const global = (property) => testEnv.global(property);

export const click = (elem) => testEnv.click(elem);

export const input = (elem, val) => testEnv.input(elem, val);

export const httpReq = (method, link, data, headers) => (
    testEnv.httpReq(method, link, data, headers)
);

export const addResult = (descr, res) => testEnv.addResult(descr, res);

export const setBlock = (title, category) => testEnv.setBlock(title, category);

export const setDuration = (duration) => testEnv.setDuration(duration);

export const getContent = () => testEnv.getContent();
