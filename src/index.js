import { Environment } from './env/Environment.js';

export { TestView } from './view/TestView.js';
export { TestComponent } from './view/TestComponent.js';
export { Runner } from './Runner.js';
export { TestApplication } from './TestApplication.js';
export { TestStory } from './TestStory.js';
export * from './utils.js';
export * from './assert.js';

const env = Environment.instance;

/**
 * Run action and add result to the list
 * @param {string} descr - description of test
 * @param {Function} action - action function
 */
export async function test(descr, action) {
    try {
        const res = await action();

        env.addResult(descr, res);
    } catch (e) {
        const extError = (e instanceof Error) ? e : new Error(e);
        extError.descr = descr;
        throw extError;
    }
}

export const baseUrl = () => env.baseUrl();

export const url = () => env.url();

export const getSelectedStory = () => env.getSelectedStory();

export const navigation = (action) => env.navigation(action);

export const setErrorHandler = () => env.setErrorHandler();

export const goTo = (link) => env.goTo(link);

export const parentNode = (elem) => env.parentNode(elem);

export const query = (...args) => env.query(...args);

export const queryAll = (...args) => env.queryAll(...args);

export const closest = (elem, selector) => env.closest(elem, selector);

export const hasClass = (elem, className) => env.hasClass(elem, className);

export const isVisible = (elem, recursive) => env.isVisible(elem, recursive);

export const select = (elem, value, bool) => env.select(elem, value, bool);

export const check = (elem) => env.check(elem);

export const onChange = (elem) => env.onChange(elem);

export const onBlur = (elem) => env.onBlur(elem);

export const prop = (elem, property) => env.prop(elem, property);

export const attr = (elem, attribute) => env.attr(elem, attribute);

export const hasAttr = (elem, attribute) => env.hasAttr(elem, attribute);

export const waitForSelector = (selector, options) => (
    env.waitForSelector(selector, options)
);

export const waitForFunction = (condition, options) => (
    env.waitForFunction(condition, options)
);

export const wait = (condition, options) => env.wait(condition, options);

export const timeout = (ms) => env.timeout(ms);

export const global = (property) => env.global(property);

export const click = (elem) => env.click(elem);

export const input = (elem, val) => env.input(elem, val);

export const httpReq = (method, link, data, headers) => (
    env.httpReq(method, link, data, headers)
);

export const addResult = (descr, res) => env.addResult(descr, res);

export const setBlock = (title, category) => env.setBlock(title, category);

export const setDuration = (duration) => env.setDuration(duration);

export const getContent = () => env.getContent();
