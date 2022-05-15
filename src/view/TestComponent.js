import { isFunction, isObject } from '../utils.js';
import { assert } from '../assert.js';
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
        await this.resolveContentVisibility();

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

    async resolveContentVisibility() {
        for (const key in this.content) {
            if (!Object.prototype.hasOwnProperty.call(this.content, key)) {
                continue;
            }

            const component = this.content[key];
            if (!isObject(component)) {
                continue;
            }

            const visible = await TestComponent.isVisible(component);
            if (component.content && isFunction(component.checkValues)) {
                component.content.visible = visible;
            } else {
                component.visible = visible;
            }
        }
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
                    res = assert.deepMeet(control, expected, true);
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
                        res = assert.deepMeet(controlArrayItem, expectedArrayItem, true);
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

        this.checkValues(stateObj);

        return true;
    }
}
