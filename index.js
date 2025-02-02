import http from 'http';
import fs from 'fs';
import path from 'path'

const Host = "http://localhost:8080";

const urlDatabase = {};

const Base = 691;
const Mod = [3521614606199, 3521614606183];

function hashFunction(str, ModId) {
    let ans = 0;
    for (let i = 0; i < str.length; i++) ans = (ans * Base + str[i].charCodeAt(0)) % Mod[ModId];
    return ans;
}

function toBase62(num) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    while (num > 0) {
        result = chars[num % 62] + result;
        num = Math.floor(num / 62);
    }

    return result.padStart(7, '0');
}

function shorten(url) {
    return toBase62(hashFunction(url, 0)) + toBase62(hashFunction(url, 1));
}

const Server = http.createServer((req, res) => {
    console.log(req.url);
    if (req.url == '/shorten') {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });

            req.on('end', () => {
                const url = body;
                console.log(url);

                const urlID = `/${shorten(url)}`;
                const shortenedUrl = Host + urlID;
                urlDatabase[urlID] = url;
                console.log(urlDatabase);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                console.log(JSON.stringify({ shortenedUrl }));

                res.end(JSON.stringify({ shortenedUrl }));
            });
        }
        else {
            fs.readFile("./shorten.html", (err, data) => {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
                return;
            });
        }
        return;
    }

    if (req.url.startsWith('/') && urlDatabase[req.url]) {
        const originalUrl = urlDatabase[req.url];
        console.log(originalUrl);

        res.writeHead(302, { Location: originalUrl }); // Redirect to the original URL
        res.end();
        return;
    }
});

Server.listen(8080);