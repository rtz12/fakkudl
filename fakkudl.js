#!/usr/bin/env node

var http = require('http'),
    fs = require('fs');
    
function get(options, callback) {
    http.get(options, function(res) {
        res.setEncoding('binary');
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            callback(body);
        });
    }).on('error', function(e) {
        callback(false);
    });
}

function download(type, name) {
    get({
        host: 'www.fakku.net',
        port: 80,
        path: '/' + type + '/' + name + '/read'
    }, function(data) {
        if(!data) {
            console.log('Download failed.');
            process.exit();
        }

        if(data.indexOf('The page you are trying to view does not exist.') !== -1) {
            console.log('Manga could not be found.');
            process.exit();
        }

        var pages = data.match(/var data = {"thumbs":\[(.*?)\]};/)[1].split('","').length;
        var path = data.match(/return 'http:\/\/cdn.fakku.net(.*?)' \+ x \+ '\.jpg\';/)[1];

        if(!fs.existsSync(name))
            fs.mkdirSync(name);

        for(var i = 1; i <= pages; i++) {(function() {
            var id = '' + i;
            while(id.length < 3)
                id = '0' + id;

            get({
                host: 'cdn.fakku.net',
                port: 80,
                path: path + id + '.jpg'
            }, function(data) {
                var path = name + '/' + id + '.jpg';
                fs.writeFileSync(path, data, 'binary');
                printStatus(path, pages);
            });
        })()}
    });
}

var _currentPage = 0;
function printStatus(name, pages) {
    console.log(name + '...\t' + (++_currentPage) + '/' + pages);
}

function printHelp() {
    console.log('Usage:\n' +
                '\tfakkudl http://www.fakku.net/TYPE/NAME/\n' +
                '\tfakkudl TYPE NAME\n' +
                '\tfakkudl TYPE/NAME\n');
}

var args;
if(process.argv[0] === 'node')
    args = process.argv.slice(2);
else
    args = process.argv.slice(1);
    
if(args.length === 1) {
    var match = args[0].match(/(?:(?:http:\/\/)?(?:www\.)?fakku\.net\/)?([^\/]+?)\/([^\/]+)(?:\/|$)/);
    download(match[1], match[2]);
} else if(args.length === 2) {
    download(args[0], args[1]);
} else {
    printHelp();
}
