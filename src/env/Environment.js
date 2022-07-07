import { isFunction } from '../utils.js';

export class Environment {
    constructor() {
        this.app = null;
        this.results = null;
        this.validateContent = null;
        this.routeHandler = null;
        this.startTime = 0;
        this.errorHandler = this.onPageError.bind(this);

        this.interface = [
            'baseUrl',
            'url',
            'navigation',
            'isFullScenario',
            'setErrorHandler',
            'goTo',
            'parentNode',
            'query',
            'queryAll',
            'closest',
            'hasClass',
            'isVisible',
            'select',
            'check',
            'onChange',
            'onBlur',
            'prop',
            'attr',
            'waitForSelector',
            'waitForFunction',
            'wait',
            'timeout',
            'global',
            'click',
            'input',
            'httpReq',
            'addResult',
            'setBlock',
            'setDuration',
            'getContent',
        ];
    }

    inject(target) {
        if (!this.app) {
            throw new Error('Environment is not initialized');
        }

        this.interface.forEach((method) => {
            if (!isFunction(this[method])) {
                throw new Error(`Method ${method} not implemented`);
            }

            if (!(method in target)) {
                Object.defineProperty(target, method, {
                    value: this[method].bind(this),
                    writable: false,
                    enumerable: false,
                });
            }
        });
    }

    resetResults() {
        this.results = {
            total: 0,
            ok: 0,
            fail: 0,
            expected: 0,
        };
    }

    async onNavigate() {
        if (isFunction(this.validateContent)) {
            const content = await this.getContent();
            this.validateContent(content);
        }

        if (!isFunction(this.routeHandler)) {
            throw new Error('Route handler not set');
        }

        const ViewClass = await this.routeHandler(this, await this.url());
        this.app.view = new ViewClass({ environment: this });
        await this.app.view.parse();
    }

    onPageError(error) {
        this.addResult(error);
        throw error;
    }

    /** Click by checkbox/radio element and trigger 'onchange' event */
    async check(elem) {
        await this.click(elem);
        return this.onChange(elem);
    }

    async wait(condition, options) {
        if (typeof condition === 'string') {
            return this.waitForSelector(condition, options);
        }

        if (isFunction(condition)) {
            return this.waitForFunction(condition, options);
        }

        throw new Error('Invalid type of condition');
    }

    /** Wait for specified function until it return truly result or throw by timeout */
    async waitForFunction(condition, options = {}) {
        if (!options) {
            throw new Error('Invalid options specified');
        }
        if (!isFunction(condition)) {
            throw new Error('Invalid options specified');
        }

        return this.waitFor(async () => {
            const res = await condition();

            if (res) {
                return { value: res };
            }

            return false;
        }, options);
    }

    async waitFor(conditionFunc, options = {}) {
        const {
            timeout = 30000,
            polling = 200,
        } = options;

        return new Promise((resolve, reject) => {
            let qTimer = 0;
            const limit = setTimeout(() => {
                if (qTimer) {
                    clearTimeout(qTimer);
                }
                reject(new Error('Wait timeout'));
            }, timeout);

            async function queryCondition(condition) {
                const res = await condition();

                if (res) {
                    clearTimeout(limit);
                    resolve(res.value);
                } else {
                    qTimer = setTimeout(() => queryCondition(condition), polling);
                }
            }

            queryCondition.call(this, conditionFunc);
        });
    }

    async timeout(ms) {
        const delay = parseInt(ms, 10);
        if (Number.isNaN(delay)) {
            throw new Error('Invalid timeout specified');
        }

        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    }

    /* eslint-disable-next-line no-unused-vars, no-empty-function */
    async init(options) {
    }

    beforeRun() {
        this.startTime = Date.now();
    }

    afterRun() {
        const testsDuration = Date.now() - this.startTime;

        this.setDuration(testsDuration);
    }

    async runTests() {
        this.beforeRun();

        await this.app.startTests();

        this.afterRun();
    }
}
