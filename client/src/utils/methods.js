
export const getCookie = (cookies, name) => {
    const cookieArr = cookies.split(';');
    for (const cookie of cookieArr) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return cookieValue;
        }
    }
    return null;
};
