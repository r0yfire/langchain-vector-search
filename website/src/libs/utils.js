export const padString = (value, padChar = '0', maxLength = 2) => {
    let output = `${value}`;
    let len = output.length;
    while (len < maxLength) {
        output = `${padChar}${output}`;
        len = output.length;
    }
    return output;
};

// get nested value from object or `null`
export const getOrNull = (path, obj = {}, defaultReturn = null) => {
    if (typeof path === 'function') {
        return path(obj);
    }
    return path.split('.').reduce((acc, curr) => {
        if (acc) {
            if (typeof acc[curr] === 'undefined') {
                return defaultReturn;
            }
            if (acc[curr] === 0) {
                return 0;
            }
            if (acc[curr]) {
                return acc[curr];
            }
        }
        return defaultReturn;
    }, obj);
};
export const exec = (promise, log = false) => {
    return promise
        .then(data => {
            return [null, data];
        })
        .catch(error => {
            if (log) {
                console.error(error);
            }
            return [error];
        });
};

export const allSettled = async (promises = []) => {
    return Promise.all(
        promises.map((promise, i) =>
            promise
                .then(value => ({
                    status: "fulfilled",
                    value,
                }))
                .catch(reason => ({
                    status: "rejected",
                    reason,
                }))
        )
    );
};

export const capitalize = (value = '') => `${value.substring(0, 1).toUpperCase()}${value.substring(1)}`;
export const capitalizeAll = (value = '') => value.replace(/\b\w/g, l => l.toUpperCase());

export const setObjPath = (obj, path, value) => {
    const pathList = path.split('.');
    const key = pathList.pop();
    const pointer = pathList.reduce((acc, curr) => {
        if (acc[curr] === undefined) acc[curr] = {};
        return acc[curr];
    }, obj);
    pointer[key] = value;
    return obj;
};

export const invertHex = hex => {
    hex = hex.replace('#', '');
    let r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000000' : '#FFFFFF';
};

export const generateRandomString = (length = 5) => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

export const decodeHtmlEntities = html => {
    const htmlEntities = {
        nbsp: ' ',
        cent: '¢',
        pound: '£',
        yen: '¥',
        euro: '€',
        copy: '©',
        reg: '®',
        lt: '<',
        gt: '>',
        quot: '"',
        amp: '&',
        apos: '\''
    };
    return html.replace(/&([^;]+);/g, (entity, entityCode) => {
        let match;
        if (entityCode in htmlEntities) {
            return htmlEntities[entityCode];
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#(\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });
};

export const stripHTML = (html = '') => {
    html = html.replace(/<br\/?>/g, '\n'); // replace '<br/>' with '\n'
    html = html.replace(/<\/p>/g, '\n'); // replace '</p>' with '\n'
    html = html.replace(/<[^>]*>?/gm, ''); // remove HTML tags
    html = decodeHtmlEntities(html); // decode HTML entities
    return html;
};

export const snakeCaseToTitleCase = (key = '') => {
    return `${key.substring(0, 1).toUpperCase()}${key.substring(1)}`.replace(/(_|-)/g, ' ');
};

export const camelCaseToTitleCase = (camelCaseString) => {
    const result = camelCaseString
        .replace(/(_)+/g, ' ')
        .replace(/([a-z])([A-Z][a-z])/g, "$1 $2")
        .replace(/([A-Z][a-z])([A-Z])/g, "$1 $2")
        .replace(/([a-z])([A-Z]+[a-z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z][a-z])/g, "$1 $2")
        .replace(/([a-z]+)([A-Z0-9]+)/g, "$1 $2")

        // Note: the next regex includes a special case to exclude plurals of acronyms, e.g. "ABCs"
        .replace(/([A-Z]+)([A-Z][a-rt-z][a-z]*)/g, "$1 $2")
        .replace(/([0-9])([A-Z][a-z]+)/g, "$1 $2")

        // Note: the next two regexes use {2,} instead of + to add space on phrases like Room26A and 26ABCs but not on phrases like R2D2 and C3PO"
        .replace(/([A-Z]{2,})([0-9]{2,})/g, "$1 $2")
        .replace(/([0-9]{2,})([A-Z]{2,})/g, "$1 $2")
        .trim();

    // capitalize the first letter
    return result.charAt(0).toUpperCase() + result.slice(1);
};

export const s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
};

export const uuid = () => {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

export const removeUndefined = (obj = {}) => {
    let key;
    for (key of Object.keys(obj)) {
        if (obj[key] === undefined) {
            delete obj[key];
        } else if (obj[key] && obj[key] === '') {
            delete obj[key];
        } else if (obj[key] && obj[key] instanceof Object) {
            removeUndefined(obj[key]);
        }
    }
    return obj;
};

export const andJoin = strings => [strings.slice(0, -1).join(', '), strings.slice(-1)[0]].join(strings.length < 2 ? '' : ' and ');
