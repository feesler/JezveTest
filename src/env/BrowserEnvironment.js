import {
    isObject,
    copyObject,
    formatTime,
    isFunction,
    visibilityResolver,
    createElement,
} from '../utils.js';
import { Environment } from './Environment.js';

export class BrowserEnvironment extends Environment {
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
    }

    baseUrl() {
        return this.base;
    }

    async url() {
        return this.viewframe.contentWindow.location.href;
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

        return (typeof selector === 'string') ? parent.querySelector(selector) : selector;
    }

    async queryAll(...args) {
        if (!args.length) {
            return null;
        }

        const parentSpecified = (args.length > 1);
        const selector = parentSpecified ? args[1] : args[0];
        const parent = parentSpecified ? args[0] : this.vdoc.documentElement;

        return (typeof selector === 'string')
            ? Array.from(parent.querySelectorAll(selector))
            : selector;
    }

    async closest(element, selector) {
        return (typeof selector === 'string') ? element.closest(selector) : selector;
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

    async hasClass(elem, cl) {
        return elem.classList.contains(cl);
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
    async selectByValue(elem, value, bool = true) {
        if (!elem || !elem.options) {
            throw new Error('Invalid select element');
        }
        if (typeof value === 'undefined') {
            throw new Error('Invalid value');
        }

        const selValue = value.toString();
        const selBool = !!bool;
        for (let i = 0, l = elem.options.length; i < l; i += 1) {
            const option = elem.options[i];
            if (option && option.value === selValue) {
                if (elem.multiple) {
                    option.selected = selBool;
                } else {
                    elem.selectedIndex = i;
                }
                return;
            }
        }

        throw new Error('Value not found');
    }
    /* eslint-enable no-param-reassign */

    async onChange(elem) {
        if ('createEvent' in this.vdoc) {
            const evt = this.vdoc.createEvent('HTMLEvents');
            evt.initEvent('change', true, false);
            elem.dispatchEvent(evt);
        } else {
            elem.fireEvent('onchange');
        }
    }

    async onBlur(elem) {
        return elem.onblur();
    }

    /* eslint-disable no-param-reassign */
    async input(elem, val) {
        if (elem.value === '' && val === '') {
            return;
        }

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
    /* eslint-enable no-param-reassign */

    async click(elem) {
        if (!elem) {
            return;
        }

        let event;
        if (typeof MouseEvent !== 'function') {
            event = this.vdoc.createEvent('MouseEvent');
            event.initMouseEvent('click',
                true, true, this.viewframe.contentWindow,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
        } else {
            event = new MouseEvent('click', {
                view: this.viewframe.contentWindow,
                bubbles: true,
                cancelable: true,
            });
        }

        elem.dispatchEvent(event);
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

    /* eslint-disable */
    scopedQuerySelectorPolyfill(view) {
        try {
            // test for scope support
            view.document.querySelector(':scope *');
        } catch (error) {
            (function (ElementPrototype) {
                // scope regex
                var scope = /:scope(?![\w-])/gi;

                // polyfill Element#querySelector
                var querySelectorWithScope = polyfill(ElementPrototype.querySelector);

                ElementPrototype.querySelector = function querySelector(selectors) {
                    return querySelectorWithScope.apply(this, arguments);
                };

                // polyfill Element#querySelectorAll
                var querySelectorAllWithScope = polyfill(ElementPrototype.querySelectorAll);

                ElementPrototype.querySelectorAll = function querySelectorAll(selectors) {
                    return querySelectorAllWithScope.apply(this, arguments);
                };

                // polyfill Element#matches
                if (ElementPrototype.matches) {
                    var matchesWithScope = polyfill(ElementPrototype.matches);

                    ElementPrototype.matches = function matches(selectors) {
                        return matchesWithScope.apply(this, arguments);
                    };
                }

                // polyfill Element#closest
                if (ElementPrototype.closest) {
                    var closestWithScope = polyfill(ElementPrototype.closest);

                    ElementPrototype.closest = function closest(selectors) {
                        return closestWithScope.apply(this, arguments);
                    };
                }

                function polyfill(qsa) {
                    return function (selectors) {
                        // whether the selectors contain :scope
                        var hasScope = selectors && scope.test(selectors);

                        if (hasScope) {
                            // fallback attribute
                            var attr = 'q' + Math.floor(Math.random() * 9000000) + 1000000;

                            // replace :scope with the fallback attribute
                            arguments[0] = selectors.replace(scope, '[' + attr + ']');

                            // add the fallback attribute
                            this.setAttribute(attr, '');

                            // results of the qsa
                            var elementOrNodeList = qsa.apply(this, arguments);

                            // remove the fallback attribute
                            this.removeAttribute(attr);

                            // return the results of the qsa
                            return elementOrNodeList;
                        }

                        // return the results of the qsa
                        return qsa.apply(this, arguments);
                    };
                }
            })(view.Element.prototype);
        }
    }
    /* eslint-enable */

    /** Apply polyfills not required by application, but needed for test engine */
    applyPolyfills(view) {
        this.scopedQuerySelectorPolyfill(view);
    }

    setErrorHandler() {
        window.addEventListener('message', (e) => {
            this.viewError = copyObject(e.data);
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

                    this.applyPolyfills(this.viewframe.contentWindow);

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

        this.startbtn = document.getElementById('startbtn');
        this.totalRes = document.getElementById('totalRes');
        this.okRes = document.getElementById('okRes');
        this.failRes = document.getElementById('failRes');
        this.durationRes = document.getElementById('durationRes');
        this.viewframe = document.getElementById('viewframe');
        this.resContainer = document.querySelector('.results-container');
        this.toggleResBtn = document.getElementById('toggleresbtn');
        this.restbl = document.getElementById('restbl');
        if (!this.startbtn
            || !this.totalRes
            || !this.okRes
            || !this.failRes
            || !this.durationRes
            || !this.viewframe
            || !this.resContainer
            || !this.toggleResBtn
            || !this.restbl
        ) {
            throw new Error('Fail to init tests');
        }

        this.toggleResBtn.addEventListener('click', () => {
            const clName = 'results-expanded';
            const isExpanded = this.resultsBlock.classList.contains(clName);

            this.toggleResBtn.value = isExpanded ? 'Show' : 'Hide';
            this.resultsBlock.classList.toggle(clName);

            if (!isExpanded && this.newResultsAvailable) {
                this.newResultsAvailable = false;
                this.resContainer.scrollTop = this.resContainer.scrollHeight;
            }
        });

        this.startbtn.addEventListener('click', async () => {
            try {
                this.results = {
                    total: 0,
                    ok: 0,
                    fail: 0,
                    expected: 0,
                };

                if (this.app.config.testsExpected) {
                    this.results.expected = this.app.config.testsExpected;
                }
                this.setErrorHandler();

                this.addResult('Test initialization', true);

                await this.runTests();
            } catch (e) {
                this.addResult(e);
            }
        });
    }
}
