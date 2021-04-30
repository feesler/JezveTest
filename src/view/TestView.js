import {
    isFunction,
    isObject,
    checkObjValue,
} from '../utils.js';

/** Common test view class */
export class TestView {
    constructor({ environment }) {
        this.environment = environment;
        if (this.environment) {
            this.environment.inject(this);
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
        this.location = await this.url();

        this.content = await this.parseContent();
        await this.updateModel();
    }

    async performAction(action) {
        if (!isFunction(action)) {
            throw new Error('Wrong action specified');
        }

        if (!this.content && !this.header) {
            await this.parse();
        }

        await action.call(this);

        await this.parse();
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
                res = await this.checkVisibility(control, expVisible);
            } else {
                factVisible = !!(control && await this.isVisible(control.elem, true));
                res = (expVisible === factVisible);
            }

            if (!res) {
                throw new Error(`Not expected visibility(${factVisible}) of "${countrolName}" control`);
            }
        }

        return true;
    }

    checkValues(controls) {
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

            if (isObject(expected) || Array.isArray(expected)) {
                res = checkObjValue(control, expected, true);
                if (res !== true) {
                    res.key = `${countrolName}.${res.key}`;
                    break;
                }
            } else if (
                (isObj && control.value !== expected)
                || (!isObj && control !== expected)
            ) {
                res = {
                    key: countrolName,
                    value: control.value,
                    expected,
                };
                break;
            }
        }

        if (res !== true) {
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

        checkObjValue(this.msgPopup, (stateObj.msgPopup) ? stateObj.msgPopup : null);
        checkObjValue(this.header, stateObj.header);
        await this.checkVisibility(this.content, stateObj.visibility);
        this.checkValues(stateObj.values);

        return true;
    }
}
