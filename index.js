import http from 'http';
import fs from 'fs';
import path from 'path'

const urlDatabase = {};
const revDatabase = {};

let idcount = 0;

function toBase62(num) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    while (num > 0) {
        result = chars[Number(num % 62)] + result;
        num = Math.floor(num / 62);
    }

    return result.padStart(7, '0');
}

const Server = http.createServer((req, res) => {
    console.log(req.url);
    
    if (req.url == '/') {
        if (req.method === 'POST') {
            let url = '';
            req.on('data', chunk => { url += chunk.toString(); });

            req.on('end', async () => {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                if(revDatabase[url]){
                    res.end(`! ${revDatabase[url]}`);
                    return;
                }
                if(!URL.canParse(url)){
                    res.end("#");
                    return;
                }
                if((await fetch(url).catch(() => {}))?.ok === true){
                    const urlID = `/${toBase62(idcount++)}`;
                    const shortenedUrl = urlID;
                    urlDatabase[urlID] = url;
                    revDatabase[url] = urlID;

                    res.end(shortenedUrl);
                }
                else res.end("#");
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
            fs.createReadStream("./404.html").pipe(res);
        }
    }
    return;
});

Server.listen(8080);