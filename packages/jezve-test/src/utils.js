import { isFunction } from '@jezvejs/types';

/**
 * Returns visibility of element.
 * In case recursive flag is true, check visibility of all parents up to document
 * @param {Element} elem
 * @param {boolean} recursive
 */
export function visibilityResolver(elem, recursive) {
    let robj = elem;

    while (robj && robj.nodeType && robj.nodeType !== 9) {
        if (robj.hasAttribute('hidden')) {
            return false;
        }

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
