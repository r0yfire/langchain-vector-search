export const isServer = !(typeof window !== 'undefined' && window.document && window.document.createElement);

export const createCookie = (name, value, expireDateStr) => {
    let expires, date;
    if (expireDateStr) {
        date = new Date(expireDateStr);
        expires = date.toUTCString();
    } else {
        date = new Date().getTime() + 43200000;
        expires = new Date(date).toUTCString();
    }
    let cookie = `${name}=${value}; expires=${expires}; path=/`;
    if (!isServer) {
        document.cookie = cookie;
    } else {
        return cookie;
    }
};

export const readCookie = (name, serializedCookies) => {
    if (!isServer && !serializedCookies) {
        serializedCookies = document.cookie;
    }
    if (!serializedCookies) {
        return null;
    }
    let nameEQ = name + "=";
    let parts = serializedCookies.split(';');
    for (let i = 0; i < parts.length; i++) {
        let c = parts[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

export const eraseCookie = (name) => {
    createCookie(name, "", 'Thu, 01 Jan 1970 00:00:00 UTC');
};