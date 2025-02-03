import http from 'http';
import fs from 'fs';
import path from 'path'

const Host = "http://localhost:8080";

const urlDatabase = {};

const Base = 691n;
const Mod = [839299365868340213n, 839299365868340207n];

function hashFunction(str, ModId) {
    let ans = 0n;
    for (let i = 0; i < str.length; i++) ans = (ans * Base + BigInt(str[i].charCodeAt(0))) % Mod[ModId];
    return ans;
}

function toBase62(num) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    while (num > 0n) {
        result = chars[Number(num % 62n)] + result;
        num = num / 62n;
    }

    return result.padStart(10, '0');
}

function shorten(url) {
    return toBase62(hashFunction(url, 0)) + toBase62(hashFunction(url, 1));
}

const Server = http.createServer((req, res) => {
    if (req.url == '/shorten') {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });

            req.on('end', () => {
                const url = body;
                const urlID = `/${shorten(url)}`;
                const shortenedUrl = Host + urlID;
                urlDatabase[urlID] = url;
                res.writeHead(200, { 'Content-Type': 'text/plain' });

                res.end(shortenedUrl);
            });
        }
        else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            fs.createReadStream("./shorten.html").pipe(res);
        }
    }
    else if (req.url.startsWith('/')) {
        if (urlDatabase[req.url]) {
            const originalUrl = urlDatabase[req.url];
            res.writeHead(302, { Location: originalUrl });
            res.end();
        }
        else{
            res.writeHead(404, { 'Content-Type': 'text/html' });
            fs.createReadStream("./noneexist.html").pipe(res);
        }
    }
    return;
});

Server.listen(8080);