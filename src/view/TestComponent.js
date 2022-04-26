import {
    isFunction,
    isObject,
    checkObjValue,
} from '../utils.js';
import { getEnv } from '../index.js';

export class TestComponent {
    constructor(...args) {
        this.model = {};

        const parentSpecified = (args.length > 0);
        if (parentSpecified) {
            const parent = args[0];
            if (!parent) {
                throw new Error('Invalid parent specified');
            }

            this.parent = parent;
        }

        const elemSpecified = (args.length > 1);
        if (elemSpecified) {
            const elem = args[1];
            if (!elem) {
                throw new Error('Invalid element specified');
            }

            this.elem = elem;
        }
    }

    async parseContent() {
        return {};
    }

    async buildModel() {
        return {};
    }

    async updateModel() {
        this.model = await this.buildModel(this.content);
    }

    async parse() {
        this.content = await this.parseContent();
        await this.postParse();

        await this.updateModel();
    }

    /* eslint-disable-next-line no-empty-function */
    async postParse() {
    }

    static async create(...args) {
        if (args.length < 2 || !args[1]) {
            return null;
        }

        const instance = new this(...args);
        await instance.parse();

        return instance;
    }

    static async isVisible(item) {
        if (!item || !item.elem) {
            return false;
        }

        const env = getEnv();
        if (!env) {
            throw new Error('Invalid environment');
        }

        return env.isVisible(item.elem, true);
    }

    isActionAvailable(action) {
        return (typeof action === 'string' && isFunction(this[action]));
    }

    async runAction(action, data) {
        if (!this.isActionAvailable(action)) {
            throw new Error('Invalid action specified');
        }

        return this[action].call(this, data);
    }

    async performAction(action) {
        if (!isFunction(action)) {
            throw new Error('Wrong action specified');
        }

        if (!this.content) {
            await this.parse();
        }

        await action.call(this);

        await this.parse();
    }

    /**
     * Compare visibiliy of specified controls with expected mask
     * In the controls object each value must be an object with 'elem' property containing pointer
     *  to DOM element
     * In the expected object each value must be a boolean value
     * For false expected control may be null or invisible
     * Both controls and expected object may contain nested objects
     * Example:
     *     controls : {
     *         control_1 : { elem : Element },
     *         control_2 : { childControl : { elem : Element } }
     *     }
     *     expected : {
     *         control_1 : true,
     *         control_2 : { childControl : true, invControl : false },
     *         control_3 : false
     *     }
     * @param {Object} controls
     * @param {Object} expected
     */
    async checkVisibility(controls, expected) {
        let res;

        if (!controls) {
            throw new Error('Wrong parameters');
        }

        // Undefined expected value is equivalent to empty object
        if (typeof expected === 'undefined') {
            return true;
        }

        for (const countrolName in expected) {
            if (!Object.prototype.hasOwnProperty.call(expected, countrolName)) {
                continue;
            }

            let factVisible;
            const expVisible = expected[countrolName];
            const control = controls[countrolName];

            if (isObject(expVisible)) {
                if (control && isFunction(control.checkVisibility)) {
                    res = await control.checkVisibility(control.content, expVisible);
                } else {
                    res = await this.checkVisibility(control, expVisible);
                }
            } else {
                const env = getEnv();
                if (!env) {
                    throw new Error('Invalid environment');
                }
                factVisible = !!(control && await env.isVisible(control.elem, true));
                res = (expVisible === factVisible);
            }

            if (!res) {
                throw new Error(`Not expected visibility(${factVisible}) of "${countrolName}" control`);
            }
        }

        return true;
    }

    checkValues(controls, ret = false) {
        let res = true;

        for (const countrolName in controls) {
            if (!Object.prototype.hasOwnProperty.call(controls, countrolName)) {
                continue;
            }

            if (!(countrolName in this.content)) {
                throw new Error(`Control (${countrolName}) not found`);
            }
            const expected = controls[countrolName];
            const control = this.content[countrolName];
            const isObj = isObject(control);

            if (isObject(expected)) {
                if (control && isFunction(control.checkValues)) {
                    res = control.checkValues(expected, true);
                } else {
                    res = checkObjValue(control, expected, true);
                }
                if (res !== true) {
                    res.key = `${countrolName}.${res.key}`;
                    break;
                }
            } else if (Array.isArray(expected)) {
                for (let ind = 0; ind < expected.length; ind += 1) {
                    const expectedArrayItem = expected[ind];
                    const controlArrayItem = control[ind];

                    if (controlArrayItem && isFunction(controlArrayItem.checkValues)) {
                        res = controlArrayItem.checkValues(expectedArrayItem, true);
                    } else {
                        res = checkObjValue(controlArrayItem, expectedArrayItem, true);
                    }

                    if (res !== true) {
                        res.key = `${countrolName}[${ind}].${res.key}`;
                        break;
                    }
                }
            } else if (
                (isObj && control.content && control.content.value !== expected)
                || (!isObj && control !== expected)
            ) {
                res = {
                    key: countrolName,
                    value: (isObj) ? control.content.value : control,
                    expected,
                };
                break;
            }
        }

        if (res !== true && !ret) {
            let msg;
            if ('expected' in res) {
                msg = `Not expected value "${res.value}" for (${res.key}) "${res.expected}" is expected`;
            } else {
                msg = `Path (${res.key}) not found`;
            }
            throw new Error(msg);
        }

        return res;
    }

    async checkState(state) {
        const stateObj = (typeof state === 'undefined') ? this.expectedState : state;
        if (!stateObj) {
            throw new Error('Invalid expected state object');
        }

        await this.checkVisibility(this.content, stateObj.visibility);
        this.checkValues(stateObj.values);

        return true;
    }
}
