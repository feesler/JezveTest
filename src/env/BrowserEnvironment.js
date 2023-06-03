import {
    isObject,
    formatTime,
    isFunction,
    visibilityResolver,
    createElement,
} from '../utils.js';
import { Environment } from './Environment.js';

class BrowserEnvironment extends Environment {
    constructor() {
        super();

        this.vdoc = null;
        this.viewframe = null;
        this.viewError = null;
        this.resContainer = null;
        this.restbl = null;
        this.totalRes = null;
        this.okRes = null;
        this.failRes = null;
        this.durationRes = null;
        this.base = null;
        this.storySelect = null;
    }

    baseUrl() {
        return this.base;
    }

    async url() {
        return this.viewframe.contentWindow.location.href;
    }

    getSelectedStory() {
        const { value } = this.storySelect;
        return (value.length === 0) ? null : value;
    }

    async parentNode(elem) {
        if (!elem) {
            return null;
        }

        return elem.parentNode;
    }

    async query(...args) {
        if (!args.length) {
            return null;
        }

        const parentSpecified = (args.length > 1);
        const selector = parentSpecified ? args[1] : args[0];
        const parent = parentSpecified ? args[0] : this.vdoc.documentElement;
        if (!parent || typeof selector !== 'string') {
            return null;
        }

        return parent.querySelector(selector);
    }

    async queryAll(...args) {
        if (!args.length) {
            return null;
        }

        const parentSpecified = (args.length > 1);
        const selector = parentSpecified ? args[1] : args[0];
        const parent = parentSpecified ? args[0] : this.vdoc.documentElement;
        if (!parent || typeof selector !== 'string') {
            return null;
        }

        return Array.from(parent.querySelectorAll(selector));
    }

    async closest(elem, selector) {
        if (!elem || typeof selector !== 'string') {
            return null;
        }

        return elem.closest(selector);
    }

    async prop(elem, prop) {
        if (!elem || typeof prop !== 'string') {
            return null;
        }

        const propPath = prop.split('.');
        const res = propPath.reduce(
            (obj, propName) => (obj ? obj[propName] : null),
            elem,
        );

        return res;
    }

    async attr(elem, attribute) {
        if (!elem || typeof attribute !== 'string') {
            return null;
        }

        return elem.getAttribute(attribute);
    }

    async hasAttr(elem, attribute) {
        if (!elem || typeof attribute !== 'string') {
            return false;
        }

        return elem.hasAttribute(attribute);
    }

    // Wait for specified selector on page or return by timeout
    async waitForSelector(selector, options = {}) {
        const {
            timeout = 30000,
            visible = false,
            hidden = false,
        } = options;

        if (typeof selector !== 'string') {
            throw new Error('Invalid selector specified');
        }
        if (!!visible === !!hidden) {
            throw new Error('Invalid options specified');
        }

        return this.waitFor(() => {
            let res;

            const elem = this.vdoc.documentElement.querySelector(selector);
            if (elem) {
                const elemVisible = visibilityResolver(elem, true);
                res = ((visible && elemVisible) || (hidden && !elemVisible));
            } else {
                res = hidden;
            }

            if (res) {
                return { value: elem };
            }
            return false;
        }, { timeout });
    }

    async evaluate(pageFunc, ...args) {
        if (!isFunction(pageFunc)) {
            throw new Error('Invalid page function');
        }

        return pageFunc.call(this.viewframe.contentWindow, ...args);
    }

    async global(prop = '') {
        if (typeof prop !== 'string') {
            throw new Error('Invalid property path');
        }

        const propPath = prop.split('.');
        const res = propPath.reduce(
            (obj, propName) => (obj ? obj[propName] : null),
            this.viewframe.contentWindow,
        );

        return res;
    }

    async hasClass(elem, className) {
        if (!elem || typeof className !== 'string') {
            return null;
        }

        return elem.classList.contains(className);
    }

    /** elem could be an id string or element handle */
    async isVisible(elem, recursive) {
        let relem = elem;
        if (typeof relem === 'string') {
            relem = await this.query(`#${relem}`);
        }
        if (!relem) {
            return false;
        }

        return visibilityResolver(relem, recursive);
    }

    /* eslint-disable no-param-reassign */
    async select(elem, value, bool = true) {
        if (!elem || !elem.options) {
            throw new Error('Invalid select element');
        }
        if (typeof value === 'undefined') {
            throw new Error('Invalid value');
        }

        const selValue = value.toString();
        const selBool = !!bool;
        let found = false;
        for (let i = 0, l = elem.options.length; i < l; i += 1) {
            const option = elem.options[i];
            if (option && option.value === selValue) {
                if (elem.multiple) {
                    option.selected = selBool;
                } else {
                    elem.selectedIndex = i;
                }
                found = true;
                break;
            }
        }

        if (!found) {
            throw new Error('Value not found');
        }

        return this.onChange(elem);
    }
    /* eslint-enable no-param-reassign */

    /** Trigger 'onchange' event */
    async onChange(elem) {
        if (!elem) {
            return;
        }

        if ('createEvent' in this.vdoc) {
            const evt = this.vdoc.createEvent('HTMLEvents');
            evt.initEvent('change', true, false);
            elem.dispatchEvent(evt);
        } else {
            elem.fireEvent('onchange');
        }
    }

    async onBlur(elem) {
        if (!elem) {
            return;
        }

        await elem.onblur();
    }

    async setSelection(elem, startPos, endPos) {
        if (!elem) {
            return;
        }

        elem.focus();
        elem.setSelectionRange(startPos, endPos);
    }

    async setCursorPos(elem, pos) {
        this.setSelection(elem, pos, pos);
    }

    async copyText() {
        throw new Error('copyText method not available on browser environment');
    }

    async cutText() {
        throw new Error('cutText method not available on browser environment');
    }

    async pasteText() {
        throw new Error('pasteText method not available on browser environment');
    }

    async pressKey() {
        throw new Error('pressKey method not available on browser environment');
    }

    dispatchInputEvent(elem, val) {
        if (!elem) {
            return;
        }

        /* eslint-disable no-param-reassign */
        elem.value = val;

        let event;
        if (typeof InputEvent !== 'function') {
            event = this.vdoc.createEvent('CustomEvent');
            event.initCustomEvent('input', true, true, {});
        } else {
            event = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
            });
        }

        elem.dispatchEvent(event);
    }

    async input(elem, val) {
        if (!elem || (elem.value === '' && val === '')) {
            return;
        }

        if (val === '') {
            this.dispatchInputEvent(elem, val);
            await this.timeout(0);
            return;
        }

        const chars = val.split('');
        let inputValue = '';
        for (const char of chars) {
            inputValue += char;
            this.dispatchInputEvent(elem, inputValue);
        }

        await this.timeout(0);
    }

    async typeText() {
        throw new Error('typeText method not available on browser environment');
    }

    async click(elem) {
        if (!elem) {
            return;
        }

        elem.click();
        await this.timeout(0);
    }

    async httpReq(method, url, data, headers = {}) {
        const supportedMethods = ['get', 'head', 'post', 'put', 'delete', 'options'];

        if (typeof method !== 'string') {
            throw new Error('Invalid method parameter specified');
        }

        const lmethod = method.toLowerCase();
        if (!supportedMethods.includes(lmethod)) {
            throw new Error(`Unexpected method ${lmethod}`);
        }

        const options = {
            method: lmethod,
            headers: { ...headers },
        };

        if (lmethod === 'post' && data) {
            let postData;
            if (typeof data === 'string') {
                postData = data;
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            } else {
                postData = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
            }

            options.body = postData;
        }

        const resp = await fetch(url, options);
        const res = {
            status: resp.status,
            headers: resp.headers,
            body: await resp.text(),
            url: resp.url,
        };

        return res;
    }

    async addResult(descr, res) {
        const result = {
            descr,
            res,
            err: null,
            message: '',
        };

        if (result.descr instanceof Error) {
            result.err = result.descr;
            result.descr = result.err.descr;
            delete result.err.descr;
            result.res = false;
            result.message = result.err.message;
        }

        this.results.total += 1;
        if (res) {
            this.results.ok += 1;
        } else {
            this.results.fail += 1;
        }

        if (this.results.expected) {
            this.totalRes.textContent = `${this.results.total}/${this.results.expected}`;
        } else {
            this.totalRes.textContent = this.results.total;
        }
        this.okRes.textContent = this.results.ok;
        this.failRes.textContent = this.results.fail;

        const resStr = (result.res) ? 'OK' : 'FAIL';

        this.restbl.appendChild(
            createElement('tr', {
                children: [
                    createElement('td', { props: { textContent: result.descr } }),
                    createElement('td', { props: { textContent: resStr } }),
                    createElement('td', { props: { textContent: result.message } }),
                ],
            }),
        );

        if (!this.resContainer.scrollHeight) {
            this.newResultsAvailable = true;
        } else {
            this.resContainer.scrollTop = this.resContainer.scrollHeight;
        }

        if (result.err) {
            /* eslint-disable-next-line no-console */
            console.error(result.err);
        }
    }

    async setBlock(title, category) {
        this.restbl.appendChild(
            createElement('tr', {
                props: { className: `res-block-${category}` },
                children: createElement('td', { props: { colSpan: 3, textContent: title } }),
            }),
        );
    }

    setDuration(duration) {
        this.durationRes.textContent = formatTime(duration);
    }

    async getContent() {
        if (!this.vdoc || !this.vdoc.documentElement) {
            return '';
        }

        return this.vdoc.documentElement.innerHTML;
    }

    setErrorHandler() {
        window.addEventListener('message', (e) => {
            this.viewError = structuredClone(e.data);
            this.errorHandler(this.viewError);
        });
    }

    async navigation(action) {
        if (!isFunction(action)) {
            throw new Error('Wrong action specified');
        }

        const navPromise = new Promise((resolve, reject) => {
            this.navigationHandler = async () => {
                if (this.viewError) {
                    throw this.viewError;
                }

                try {
                    this.viewframe.removeEventListener('load', this.navigationHandler);

                    this.vdoc = this.viewframe.contentWindow.document;
                    if (!this.vdoc) {
                        throw new Error('View document not found');
                    }

                    await this.onNavigate();

                    resolve();
                } catch (e) {
                    reject(e);
                }
            };

            this.viewframe.addEventListener('load', this.navigationHandler);
        });

        await action();

        return navPromise;
    }

    async goTo(url) {
        await this.navigation(() => {
            this.viewframe.src = url;
        });
    }

    async onStart() {
        try {
            this.resetResults();

            if (this.app.config.testsExpected) {
                this.results.expected = this.app.config.testsExpected;
            }
            this.setErrorHandler();

            this.addResult('Test initialization', true);

            await this.runTests();
        } catch (e) {
            this.addResult(e);
        }
    }

    renderTestView(container) {
        if (!container) {
            throw new Error('Invalid container');
        }

        const startBtn = createElement('button', {
            props: { className: 'test-btn', type: 'button', textContent: 'Start' },
            events: { click: () => this.onStart() },
        });

        const totalTitle = createElement('th', { props: { className: 'title', textContent: 'Total' } });
        this.totalRes = createElement('th');
        const okTitle = createElement('th', { props: { className: 'title', textContent: 'Ok' } });
        this.okRes = createElement('th');
        const failTitle = createElement('th', { props: { className: 'title', textContent: 'Fail' } });
        this.failRes = createElement('th');
        this.durationRes = createElement('th', { props: { className: 'duration' } });
        const row = createElement('tr', {
            children: [
                totalTitle,
                this.totalRes,
                okTitle,
                this.okRes,
                failTitle,
                this.failRes,
                this.durationRes,
            ],
        });
        const counterTable = createElement('table', {
            props: { className: 'test-tbl counter-tbl' },
            children: row,
        });

        this.toggleResBtn = createElement('button', {
            props: { className: 'test-btn toggle-res-btn', type: 'button', textContent: 'Show' },
            events: {
                click: () => {
                    const clName = 'test-results-expanded';
                    const isExpanded = this.resultsBlock.classList.contains(clName);

                    this.toggleResBtn.textContent = isExpanded ? 'Show' : 'Hide';
                    this.resultsBlock.classList.toggle(clName);

                    if (!isExpanded && this.newResultsAvailable) {
                        this.newResultsAvailable = false;
                        this.resContainer.scrollTop = this.resContainer.scrollHeight;
                    }
                },
            },
        });

        const controlsContainer = createElement('div', {
            props: { className: 'controls' },
            children: [startBtn, counterTable, this.toggleResBtn],
        });

        const stories = this.app.scenario.getStorieNames();
        this.storySelect = createElement('select', {
            children: ['', ...stories].map((story) => (
                createElement('option', {
                    props: {
                        value: story,
                        textContent: (story.length === 0) ? 'Full scenario' : story,
                    },
                })
            )),
        });

        const storyField = createElement('div', {
            props: { className: 'story-field' },
            children: [
                createElement('label', { props: { textContent: 'Run:' } }),
                this.storySelect,
            ],
        });

        // Results table
        this.restbl = createElement('tbody');
        this.resContainer = createElement('div', {
            props: { className: 'test-results-container' },
            children: createElement('table', { children: this.restbl }),
        });
        this.resultsBlock = createElement('div', {
            props: { className: 'test-results' },
            children: [
                controlsContainer,
                storyField,
                this.resContainer,
            ],
        });

        // Tests view iframe
        this.viewframe = createElement('iframe', {
            props: { src: this.baseUrl() },
        });

        const testsView = createElement('div', {
            props: { className: 'test-view' },
            children: this.viewframe,
        });

        const contentElem = createElement('div', {
            props: { className: 'test-content' },
            children: [this.resultsBlock, testsView],
        });

        container.append(contentElem);
    }

    async init(options) {
        if (!isObject(options)) {
            throw new Error('Invalid options');
        }
        if (!options.app) {
            throw new Error('Invalid App');
        }

        if (isFunction(options.validateContent)) {
            this.validateContent = options.validateContent;
        }
        if (isFunction(options.routeHandler)) {
            this.routeHandler = options.routeHandler;
        }
        this.app = options.app;
        this.app.environment = this;

        const { origin } = window.location;
        this.base = origin;
        this.base += (typeof options.appPath === 'string')
            ? options.appPath
            : '/';

        await this.app.init();

        this.renderTestView(options.container);
    }
}

export const environment = BrowserEnvironment.create();
