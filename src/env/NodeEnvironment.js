import process from 'process';
import http from 'http';
import https from 'https';
import puppeteer from 'puppeteer';
import chalk from 'chalk';
import {
    formatTime,
    isFunction,
    isObject,
    visibilityResolver,
} from '../utils.js';
import { Environment } from './Environment.js';

export class NodeEnvironment extends Environment {
    constructor(...args) {
        super(...args);

        this.page = null;
        this.base = null;
        this.reqCookies = {};
        this.resetResults();
    }

    baseUrl() {
        return this.base;
    }

    async url() {
        return this.page.url();
    }

    isFullScenario() {
        return process.argv.every((arg) => arg !== '-p');
    }

    async parentNode(elem) {
        if (!elem) {
            return null;
        }

        return elem.evaluateHandle((el) => el.parentNode);
    }

    async query(...args) {
        if (!args.length) {
            return null;
        }

        const parentSpecified = (args.length > 1);
        const selector = parentSpecified ? args[1] : args[0];
        const parent = parentSpecified ? args[0] : this.page;

        return (typeof selector === 'string') ? parent.$(selector) : selector;
    }

    async queryAll(...args) {
        if (!args.length) {
            return null;
        }

        const parentSpecified = (args.length > 1);
        const selector = parentSpecified ? args[1] : args[0];
        const parent = parentSpecified ? args[0] : this.page;

        return (typeof selector === 'string') ? parent.$$(selector) : selector;
    }

    async closest(elem, selector) {
        if (!elem || typeof selector !== 'string') {
            return null;
        }

        const res = await elem.evaluateHandle((el, sel) => el.closest(sel), selector);
        return res.asElement();
    }

    async prop(elem, prop) {
        if (!elem || typeof prop !== 'string') {
            return null;
        }

        return elem.evaluate((el, p) => {
            const propPath = p.split('.');
            const res = propPath.reduce(
                (obj, propName) => (obj ? obj[propName] : null),
                el,
            );

            return res;
        }, prop);
    }

    async attr(elem, attribute) {
        if (!elem || typeof attribute !== 'string') {
            return null;
        }

        return elem.evaluate((el, a) => el.getAttribute(a), attribute);
    }

    async waitForSelector(selector, options) {
        return this.page.waitForSelector(selector, options);
    }

    async global(prop) {
        const windowHandle = await this.page.evaluateHandle(() => window);

        return this.page.evaluate((w, p) => {
            const propPath = p.split('.');
            const res = propPath.reduce(
                (obj, propName) => (obj ? obj[propName] : null),
                w,
            );

            return res;
        }, windowHandle, prop);
    }

    async hasClass(elem, className) {
        return elem.evaluate((el, cl) => el.classList.contains(cl), className);
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

        return relem.evaluate(visibilityResolver, recursive);
    }

    /** Select item with specified value if exist */
    /* eslint-disable no-param-reassign, no-await-in-loop */
    async select(elem, value, bool = true) {
        if (!elem) {
            throw new Error('Invalid select element');
        }
        if (typeof value === 'undefined') {
            throw new Error('Invalid value');
        }

        const selValue = value.toString();
        const selBool = !!bool;
        const res = await elem.evaluate((el, val, sel) => {
            if (!el.options || !el.options.length) {
                return false;
            }

            for (let i = 0, l = el.options.length; i < l; i += 1) {
                const option = el.options[i];
                if (option && option.value === val) {
                    if (el.multiple) {
                        option.selected = sel;
                    } else {
                        el.selectedIndex = i;
                    }
                    return true;
                }
            }

            return false;
        }, selValue, selBool);

        if (!res) {
            throw new Error('Value not found');
        }

        return this.onChange(elem);
    }
    /* eslint-enable no-param-reassign, no-await-in-loop */

    /** Trigger 'onchange' event */
    async onChange(elem) {
        return elem.evaluate((el) => {
            if ('createEvent' in document) {
                const evt = document.createEvent('HTMLEvents');
                evt.initEvent('change', true, false);
                el.dispatchEvent(evt);
            } else {
                el.fireEvent('onchange');
            }
        });
    }

    async click(elem) {
        return elem.evaluate((el) => el.click());
    }

    /* eslint-disable no-param-reassign */
    async input(elem, val) {
        if (val === '') {
            await elem.focus();
            await this.page.keyboard.down('ControlLeft');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('ControlLeft');
            return this.page.keyboard.press('Delete');
        }

        await elem.evaluate((el) => {
            el.value = '';
        });
        return elem.type(val.toString());
    }
    /* eslint-enable no-param-reassign */

    async onBlur(elem) {
        return elem.evaluate((el) => el.onblur());
    }

    /** Split attribute-value string divided by separator */
    splitSep(str, sep) {
        const sepPos = str.indexOf(sep);
        if (sepPos === -1) {
            return null;
        }

        return {
            name: str.substr(0, sepPos),
            value: str.substr(sepPos + 1),
        };
    }

    parseCookies(headers) {
        if (!headers) {
            return null;
        }

        const res = [];

        if (!('set-cookie' in headers)) {
            return res;
        }

        let cookies = headers['set-cookie'];

        if (!Array.isArray(cookies)) {
            cookies = [cookies];
        }

        cookies.forEach((cookieStr) => {
            const cookieAttributes = cookieStr.split(';');
            const cookieObj = {};

            cookieAttributes.forEach((attr) => {
                const attribute = this.splitSep(attr.trim(), '=');
                if (!attribute) {
                    return;
                }

                if (typeof cookieObj.name === 'undefined') {
                    cookieObj.name = attribute.name;
                    cookieObj.value = attribute.value;
                    cookieObj.attr = [];
                } else {
                    cookieObj.attr[attribute.name] = attr.value;
                }
            });

            res.push(cookieObj);
        });

        return res;
    }

    applyCookies(cookies) {
        if (!Array.isArray(cookies)) {
            throw new Error('Invalid cookies: array expected');
        }

        cookies.forEach((cookie) => {
            if (!cookie.name) {
                return;
            }

            if (cookie.value === '' || cookie.value === 'deleted') {
                delete this.reqCookies[cookie.name];
            } else {
                this.reqCookies[cookie.name] = cookie.value;
            }
        });
    }

    getCookiesHeader() {
        if (!this.reqCookies) {
            return null;
        }

        return Object.entries(this.reqCookies).map((entry) => {
            const [cookieName, cookieVal] = entry;
            return `${cookieName}=${cookieVal}`;
        });
    }

    async httpReq(method, url, data, headers = {}) {
        const supportedMethods = ['get', 'head', 'post', 'put', 'delete', 'options'];
        const options = {
            method: method.toLowerCase(),
            headers: { ...headers },
        };

        let resolveResult;
        let rejectResult;
        const res = new Promise((resolve, reject) => {
            resolveResult = resolve;
            rejectResult = reject;
        });

        if (!supportedMethods.includes(options.method)) {
            rejectResult(new Error(`Unexpected method ${method}`));
        }

        options.headers.Cookie = this.getCookiesHeader();

        let postData = null;
        if (options.method === 'post' && data) {
            if (typeof data === 'string') {
                postData = data;
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            } else {
                postData = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
            }

            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const targetURL = new URL(url);
        const isHTTPS = targetURL.protocol.toLowerCase() === 'https:';
        const client = (isHTTPS) ? https : http;

        if (isHTTPS) {
            options.rejectUnauthorized = false;
        }

        const req = client.request(url, options, (response) => {
            let body = '';
            let finalUrl = url;

            if (!response) {
                return;
            }

            if (response.headers && response.headers.location) {
                finalUrl = response.headers.location;
            }

            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                body += chunk;
            });
            response.on('end', () => {
                const newCookies = this.parseCookies(response.headers);
                this.applyCookies(newCookies);

                resolveResult({
                    status: response.statusCode,
                    headers: response.headers,
                    body,
                    url: finalUrl,
                });
            });
        });

        if (postData) {
            req.write(postData);
        }

        req.on('error', (e) => rejectResult(e));
        req.end();

        return res;
    }

    addResult(descr, res) {
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

        if (result.res) {
            this.results.ok += 1;
        } else {
            this.results.fail += 1;
        }

        const resStr = (result.res) ? chalk.green('OK') : chalk.red('FAIL');
        this.results.total += 1;
        let counter = this.results.total;
        if (this.results.expected) {
            counter += `/${this.results.expected}`;
        }

        console.log(`[${counter}] ${result.descr}: ${resStr} ${result.message}`);

        if (result.err) {
            console.error(result.err);
        }
    }

    setBlock(title, category) {
        const fmtTitle = ` ${title} `;
        let coloredTitle;

        if (category === 1) {
            coloredTitle = chalk.whiteBright.bgBlue(fmtTitle);
        } else if (category === 2) {
            coloredTitle = chalk.black.bgGreen(fmtTitle);
        } else if (category === 3) {
            coloredTitle = chalk.cyan(fmtTitle);
        }

        console.log(coloredTitle);
    }

    setDuration(duration) {
        console.log(`Duration of tests: ${formatTime(duration)}`);
    }

    async getContent() {
        return this.page.content();
    }

    setErrorHandler() {
        this.page.on('pageerror', this.errorHandler);
    }

    async navigation(action) {
        if (!isFunction(action)) {
            throw new Error('Wrong action specified');
        }

        const navPromise = new Promise((resolve, reject) => {
            this.page.once('load', async () => {
                try {
                    await this.onNavigate();
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        });

        await action();

        return navPromise;
    }

    async goTo(url) {
        await this.navigation(() => this.page.goto(url));
    }

    async getBrowserRevision(revision) {
        const browserFetcher = puppeteer.createBrowserFetcher();
        const localRev = browserFetcher.revisionInfo(revision);
        if (localRev) {
            return localRev;
        }

        if (!browserFetcher.canDownload(revision)) {
            throw new Error(`Can't download Chromium revision ${revision}`);
        }

        const rev = await browserFetcher.download(revision);
        if (!rev) {
            throw new Error(`Error during downloading Chromium revision ${revision}`);
        }

        return rev;
    }

    async init(options) {
        let res = 1;
        let browser;

        try {
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

            if (!this.app.config || !this.app.config.nodeURL) {
                throw new Error('Invalid config: test URL not found');
            }
            this.base = this.app.config.nodeURL;

            this.resetResults();

            if (this.app.config.testsExpected) {
                this.results.expected = this.app.config.testsExpected;
            }

            await this.app.init();

            const launchOptions = {
                headless: true,
                args: [
                    '--proxy-server="direct://"',
                    '--proxy-bypass-list=*',
                ],
            };

            if (this.app.config.browserRevision) {
                const revisionInfo = await this.getBrowserRevision(this.app.config.browserRevision);
                launchOptions.executablePath = revisionInfo.executablePath;
            }

            browser = await puppeteer.launch(launchOptions);
            const allPages = await browser.pages();
            this.page = (allPages.length) ? allPages[0] : await browser.newPage();
            this.setErrorHandler();

            this.addResult('Test initialization', true);

            await this.runTests();
            res = 0;
        } catch (e) {
            this.addResult(e);
        }

        if (browser) {
            await browser.close();
        }

        console.log(`Total: ${this.results.total} Passed: ${this.results.ok} Failed: ${this.results.fail}`);

        process.exit(res);
    }
}
