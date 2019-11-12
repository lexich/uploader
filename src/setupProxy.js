const proxy = require('http-proxy-middleware');
const Cookies = require('cookies');
module.exports = function (app) {
    const proxyReq = proxy({
        target: 'http://localhost:3001',
        changeOrigin: true
    });
    app.use((req, res, next) => {
        const cookies = new Cookies(req, res);
        if (/^\/media/.test(req.url)) {
            console.log(`PROXY ${req.url}`);
            return proxyReq(req, res, next);
        }

        if (req.url === '/' && cookies.get('jwt')) {
            console.log(`STATIC ${req.url}`);
            return next();
        }
        if (/\.[a-z]{1,5}$/i.test(req.url)) {
            console.log(`STATIC ${req.url}`);
            return next();
        }
        console.log(`PROXY ${req.url}`);
        return proxyReq(req, res, next);
    });
}
