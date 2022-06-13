/** Check object is date */
export function isDate(obj) {
    return (obj instanceof Date && !Number.isNaN(obj.valueOf()));
}

/** Check object is function */
export function isFunction(obj) {
    const getType = {};
    return obj
        && (getType.toString.call(obj) === '[object Function]'
            || typeof obj === 'function');
}

/** Check object is {} */
export function isObject(o) {
    return o !== null
        && typeof o === 'object'
        && Object.prototype.toString.call(o) === '[object Object]';
}

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

/* eslint-disable no-param-reassign */
/**
 * Assign properties from second object to first
 * @param {*} obj - object to assign properties to
 * @param {*} props - object to obtain properties from
 */
export function setProps(obj, props) {
    if (!obj || !isObject(props)) {
        return;
    }

    Object.keys(props).forEach((key) => {
        const val = props[key];
        if (Array.isArray(val)) {
            obj[key] = val.map((item) => item);
        } else if (isObject(val)) {
            if (obj[key] === null || typeof obj[key] === 'undefined') {
                obj[key] = {};
            }

            setProps(obj[key], val);
        } else {
            try {
                obj[key] = val;
            } catch (e) {
                if (obj.setAttribute) {
                    obj.setAttribute(key, val);
                }
            }
        }
    });
}
/* eslint-enable no-param-reassign */

/**
 * Create specified DOM element and set parameters if specified
 * @param {string} tagName - tag name of element to create
 * @param {Object} options
 * @param {Object} options.props - properties to set for created element
 * @param {Element[]} options.children - element or array of elements to append to created element
 * @param {Object} options.events - event handlers object
 */
export function createElement(tagName, options = {}) {
    if (typeof tagName !== 'string') {
        return null;
    }

    const elem = document.createElement(tagName);
    if (!elem) {
        return null;
    }

    if (options.props) {
        setProps(elem, options.props);
    }

    if (options.attrs) {
        Object.keys(options.attrs).forEach((attribute) => {
            const value = options.attrs[attribute];
            elem.setAttribute(attribute, value);
        });
    }

    if (options.children) {
        const childs = Array.isArray(options.children) ? options.children : [options.children];
        childs.forEach((child) => {
            if (child) {
                elem.appendChild(child);
            }
        });
    }

    if (options.events) {
        Object.keys(options.events).forEach((eventName) => {
            elem.addEventListener(eventName, options.events[eventName]);
        });
    }

    return elem;
}

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
export function leadZero(val) {
    const v = parseInt(val, 10);
    if (Number.isNaN(v)) {
        throw new Error('Invalid value');
    }

    if (v < 10) {
        return `0${v}`;
    }

    return v.toString();
}

/** Format date as DD.MM.YYYY */
export function formatDate(date) {
    if (!isDate(date)) {
        throw new Error('Invalid type of parameter');
    }

    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const day = date.getDate();
    return `${leadZero(day)}.${leadZero(month)}.${leadZero(year)}`;
}

const SECOND = 1000;
const MINUTE = 60000;
const HOUR = 3600000;

/** Format time in milliseconds to HH:MM:SS format */
export function formatTime(time) {
    const t = parseInt(time, 10);
    if (Number.isNaN(t)) {
        throw new Error('Invalid time values speicifed');
    }

    const hours = Math.floor(t / HOUR);
    const minutes = Math.floor((t % HOUR) / MINUTE);
    const seconds = Math.floor((t % MINUTE) / SECOND);

    return `${leadZero(hours)}:${leadZero(minutes)}:${leadZero(seconds)}`;
}

/** Return deep copy of object */
export function copyObject(item) {
    if (Array.isArray(item)) {
        return item.map(copyObject);
    }

    if (isObject(item)) {
        const res = {};
        Object.getOwnPropertyNames(item).forEach((key) => {
            res[key] = copyObject(item[key]);
        });

        return res;
    }

    return item;
}

/** Bind DOM ready event handler */
function bindReady(handler) {
    let called = false;

    function ready() {
        if (called) {
            return;
        }
        called = true;
        handler();
    }

    function tryScroll() {
        if (called) {
            return;
        }
        if (!document.body) {
            return;
        }
        try {
            document.documentElement.doScroll('left');
            ready();
        } catch (e) {
            setTimeout(tryScroll, 0);
        }
    }

    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => {
            ready();
        }, false);
    } else if (document.attachEvent) {
        if (document.documentElement.doScroll && window === window.top) {
            tryScroll();
        }

        document.attachEvent('onreadystatechange', () => {
            if (document.readyState === 'complete') {
                ready();
            }
        });
    }

    if (window.addEventListener) {
        window.addEventListener('load', ready, false);
    } else if (window.attachEvent) {
        window.attachEvent('onload', ready);
    }
}

/** Add new DOM ready event handler to the queue */
export function onReady(handler) {
    if (!onReady.readyList.length) {
        bindReady(() => {
            for (let i = 0; i < onReady.readyList.length; i += 1) {
                onReady.readyList[i]();
            }
        });
    }

    onReady.readyList.push(handler);
}

/** List of DOM ready handlers */
onReady.readyList = [];
