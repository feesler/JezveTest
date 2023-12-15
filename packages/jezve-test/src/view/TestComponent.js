import { assert } from '@jezvejs/assert';
import { isFunction, isObject } from '@jezvejs/types';
import { isVisible, evaluate } from '../index.js';

/**
 * Base test component class
 */
export class TestComponent {
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

        return isVisible(item.elem, true);
    }

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

    buildModel() {
        return {};
    }

    /* eslint-disable-next-line no-unused-vars */
    getExpectedState(model = this.model) {
        return {};
    }

    updateModel() {
        this.model = this.buildModel(this.content);
    }

    async parse() {
        this.content = await this.parseContent();
        await this.postParse();
        await this.resolveContentVisibility();

        this.updateModel();
    }

    /* eslint-disable-next-line no-empty-function */
    async postParse() {
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

    async runTestAction(action, model = this.model) {
        const expected = this.getExpectedState(model);

        await this.performAction(action);

        return this.checkState(expected);
    }

    async evaluateVisibility(items) {
        return evaluate((...elements) => {
            const cachedElements = [];
            const cachedVisibility = [];
            const res = [];

            for (let index = 0; index < elements.length; index += 1) {
                let elem = elements[index];
                if (!elem) {
                    res.push(false);
                    continue;
                }

                while (elem && elem.nodeType && elem.nodeType !== 9) {
                    let visible;
                    const cacheInd = cachedElements.indexOf(elem);
                    if (cacheInd !== -1) {
                        visible = cachedVisibility[cacheInd];
                    } else {
                        if (elem.hasAttribute('hidden')) {
                            visible = false;
                        } else {
                            const style = getComputedStyle(elem, '');
                            visible = (
                                style
                                && style.display !== 'none'
                                && style.visibility !== 'hidden'
                            );
                        }

                        cachedElements.push(elem);
                        cachedVisibility.push(visible);
                    }

                    if (!visible) {
                        elem = null;
                        break;
                    }

                    elem = elem.parentNode;
                }

                res.push(!!elem);
            }

            return res;
        }, ...items);
    }

    async resolveContentVisibility() {
        const contentKeys = Object.keys(this.content);
        const components = [];
        const elems = [];
        for (let index = 0; index < contentKeys.length; index += 1) {
            const componentName = contentKeys[index];
            const component = this.content[componentName];
            if (!isObject(component)) {
                continue;
            }

            const content = (component.content && isFunction(component.checkValues))
                ? component.content
                : component;
            if ('visible' in content) {
                continue;
            }

            components.push(component);
            elems.push(component.elem);
        }

        const visibility = await this.evaluateVisibility(elems, false);

        for (let index = 0; index < components.length; index += 1) {
            const component = components[index];
            const visible = !!visibility[index];
            if (component.content && isFunction(component.checkValues)) {
                component.content.visible = visible;
            } else {
                component.visible = visible;
            }
        }
    }

    checkValues(controls, path = '', ret = false) {
        let res = true;

        for (const countrolName in controls) {
            if (!Object.prototype.hasOwnProperty.call(controls, countrolName)) {
                continue;
            }

            if (!(countrolName in this.content)) {
                throw new Error(`Control '${path}${countrolName}' not found`);
            }
            const expected = controls[countrolName];
            const control = this.content[countrolName];
            const isObj = isObject(control);

            if (isObject(expected)) {
                const isTestComponent = isFunction(control?.checkValues);

                if (isTestComponent) {
                    res = control.checkValues(expected, `${path}${countrolName}.`);
                } else {
                    res = assert.deepMeet(control, expected, true);
                }

                if (res !== true) {
                    if (!isTestComponent) {
                        res.key = `${path}${countrolName}.${res.key}`;
                    }

                    break;
                }
            } else if (Array.isArray(expected) && Array.isArray(control)) {
                if (expected.length !== control.length) {
                    res = {
                        key: `${path}${countrolName}.length`,
                        value: control.length,
                        expected: expected.length,
                    };
                    break;
                }

                for (let ind = 0; ind < expected.length; ind += 1) {
                    const expectedArrayItem = expected[ind];
                    const controlArrayItem = control[ind];
                    const isTestComponent = isFunction(controlArrayItem?.checkValues);

                    if (isTestComponent) {
                        res = controlArrayItem.checkValues(expectedArrayItem, `${path}${countrolName}[${ind}].`);
                    } else {
                        res = assert.deepMeet(controlArrayItem, expectedArrayItem, true);
                    }

                    if (res !== true) {
                        if (!isTestComponent) {
                            res.key = `${path}${countrolName}[${ind}].${res.key}`;
                        }

                        break;
                    }
                }

                if (res !== true) {
                    break;
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
                msg = `Not expected value "${res.value}" for (${path}${res.key}) "${res.expected}" is expected`;
            } else {
                msg = `Path (${path}${res.key}) not found`;
            }
            throw new Error(msg);
        }

        return res;
    }

    checkState(state) {
        const stateObj = (typeof state === 'undefined') ? this.expectedState : state;
        if (!stateObj) {
            throw new Error('Invalid expected state object');
        }

        this.checkValues(stateObj);

        return true;
    }
}
