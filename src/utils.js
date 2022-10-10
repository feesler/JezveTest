/** Check parameter is date */
export const isDate = (obj) => (
    obj instanceof Date && !Number.isNaN(obj.valueOf())
);

/** Check parameter is function */
export const isFunction = (obj) => (
    obj
    && (
        Object.prototype.toString.call(obj) === '[object Function]'
        || typeof obj === 'function'
    )
);

/** Check parameter is instance of Object */
export const isObject = (obj) => (
    obj !== null
    && typeof obj === 'object'
    && Object.prototype.toString.call(obj) === '[object Object]'
);

/** Check is specified string is number */
export function isNum(val) {
    const fval = parseFloat(val);
    if (Number.isNaN(fval)) {
        return false;
    }

    if (fval === 0) {
        return true;
    }

    return !!(val / val);
}

/** Check parameter is integer */
export function isInt(x) {
    const y = parseInt(x, 10);
    if (Number.isNaN(y)) {
        return false;
    }

    return x === y && x.toString() === y.toString();
}

/** Check bit flag is set */
/* eslint-disable no-bitwise */
export const hasFlag = (x, flag) => ((x & flag) === flag);
/* eslint-enable no-bitwise */

/** Returns parameter if it is array, else wrap value to array */
export const asArray = (value) => {
    if (value === null || value === undefined) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
};

/**
 * Assign properties from second object to first
 * @param {Object} obj - object to assign properties to
 * @param {Object} props - object to obtain properties from
 */
export const setProps = (obj, props) => {
    if (!obj || !props || typeof props !== 'object') {
        return;
    }

    const res = obj;
    Object.keys(props).forEach((key) => {
        const val = props[key];
        if (Array.isArray(val)) {
            res[key] = val.map((item) => item);
        } else if (isObject(val)) {
            if (res[key] === null || typeof res[key] === 'undefined') {
                res[key] = {};
            }

            setProps(res[key], val);
        } else {
            res[key] = val;
        }
    });
};

/** Set attributes to specified element */
export const setAttributes = (element, attrs) => {
    if (!element || !isObject(attrs)) {
        return;
    }

    Object.keys(attrs).forEach((key) => {
        element.setAttribute(key, attrs[key]);
    });
};

/**
 * Append child to specified element
 * @param {Element} elem - element to append child to
 * @param {Element[]} childs - element or array of elements to append
 */
export const addChilds = (elem, childs) => {
    if (!elem || !childs) {
        return;
    }

    const children = asArray(childs);
    elem.append(...children);
};

/**
 * Set up event handlers for specified element
 * @param {Element} elem - element to set event handlers
 * @param {Object} events - event handlers object
 */
export const setEvents = (elem, events) => {
    if (!elem || !events) {
        return;
    }

    Object.keys(events).forEach((eventName) => {
        elem.addEventListener(eventName, events[eventName]);
    });
};

/**
 * Remove event handlers from specified element
 * @param {Element} elem - element to remove event handlers from
 * @param {Object} events - event handlers object
 */
export const removeEvents = (elem, events) => {
    if (!elem || !events) {
        return;
    }

    Object.keys(events).forEach((eventName) => {
        elem.removeEventListener(eventName, events[eventName]);
    });
};

/**
 * Create specified DOM element and set parameters if specified
 * @param {string} tagName - tag name of element to create
 * @param {Object} options
 * @param {Object} options.attrs - attributes to set for created element
 * @param {Object} options.props - properties to set for created element
 * @param {Element[]} options.children - element or array of elements to append to created element
 * @param {Object} options.events - event handlers object
 */
export const createElement = (tagName, options = {}) => {
    if (typeof tagName !== 'string') {
        return null;
    }

    const elem = document.createElement(tagName);
    if (!elem) {
        return null;
    }

    if (options?.props) {
        setProps(elem, options?.props);
    }
    if (options?.attrs) {
        setAttributes(elem, options.attrs);
    }
    if (options?.children) {
        addChilds(elem, options?.children);
    }
    if (options?.events) {
        setEvents(elem, options.events);
    }

    return elem;
};

/**
 * Returns visibility of element.
 * In case recursive flag is true, check visibility of all parents up to document
 * @param {Element} elem
 * @param {boolean} recursive
 */
export function visibilityResolver(elem, recursive) {
    let robj = elem;

    while (robj && robj.nodeType && robj.nodeType !== 9) {
        const cStyle = getComputedStyle(robj, '');
        if (
            !cStyle
            || cStyle.display === 'none'
            || cStyle.visibility === 'hidden'
        ) {
            return false;
        }

        if (recursive !== true) {
            break;
        }

        robj = robj.parentNode;
    }

    return !!robj;
}

/* Convert number to string and prepend zero if value is less than 10 */
export const leadZero = (val) => {
    const v = parseInt(val, 10);
    if (Number.isNaN(v)) {
        throw new Error('Invalid value');
    }

    if (v < 10) {
        return `0${v}`;
    }

    return v.toString();
};

/** Format date as DD.MM.YYYY */
export const formatDate = (date) => {
    if (!isDate(date)) {
        throw new Error('Invalid type of parameter');
    }

    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const day = date.getDate();
    return `${leadZero(day)}.${leadZero(month)}.${leadZero(year)}`;
};

const SECOND = 1000;
const MINUTE = 60000;
const HOUR = 3600000;

/** Format time in milliseconds to HH:MM:SS format */
export const formatTime = (time) => {
    const t = parseInt(time, 10);
    if (Number.isNaN(t)) {
        throw new Error('Invalid time values speicifed');
    }

    const hours = Math.floor(t / HOUR);
    const minutes = Math.floor((t % HOUR) / MINUTE);
    const seconds = Math.floor((t % MINUTE) / SECOND);

    return `${leadZero(hours)}:${leadZero(minutes)}:${leadZero(seconds)}`;
};

/** Return deep copy of object */
export const copyObject = (item) => {
    if (Array.isArray(item)) {
        return item.map(copyObject);
    }

    if (isObject(item)) {
        const res = {};

        Object.keys(item).forEach((key) => {
            res[key] = copyObject(item[key]);
        });

        return res;
    }

    return item;
};

/** Add new DOM ready event handler to the queue */
export const onReady = (handler) => {
    document.addEventListener('DOMContentLoaded', handler, false);
};

/** Maps array using async callback function */
export const asyncMap = async (data, func) => {
    if (!Array.isArray(data)) {
        throw new Error('Invalid data type');
    }
    if (!isFunction(func)) {
        throw new Error('Invalid function type');
    }

    const tasks = data.map(func);
    return Promise.all(tasks);
};
