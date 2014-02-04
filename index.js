var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    crypto = require('crypto'),
    find = require('css-find-assets'),
    unique = require('mout/array/unique'),
    contains = require('mout/array/contains');

module.exports = assets;

function assets(options) {
    return function(style) {
        process(options, style);
    };
}

function process(options, style) {
    var base = path.resolve(options.base || '.'),
        output = path.resolve(options.output || '.'),
        outputUrl = options.outputUrl || options.output;

    var assets = find(style);
    copyAssets(assets, base, output);
    rewriteAssets(assets, outputUrl);
}

function node(asset) {
    return asset.node;
}

function copyAssets(assets, base, output) {
    var copied = [];
    mkdirp.sync(output);

    assets.forEach(function(asset) {
        var node = asset.node,
            source = node.position && node.position.source;

        var contents, hash, dest;

        if (source) {
            source = path.resolve(base, path.dirname(source));
        } else {
            source = base;
        }
        source = path.join(source, asset.url);

        try {
            contents = fs.readFileSync(source);
            hash = crypto.createHash('sha1')
                .update(contents)
                .digest('hex')
                .substr(0, 16);
            dest = hash + path.extname(asset.url);
        }
        catch (e) {
            console.error('rework-assets error, missing file:', asset.url);
            asset.dest = undefined;
            return;
        }

        if (!contains(copied, dest)) {
            copied.push(dest);
            fs.writeFileSync(
                path.join(output, dest),
                contents);
        }

        asset.dest = dest;
    });
}

function rewriteAssets(assets, outputUrl) {
    if (outputUrl) {
        outputUrl += '/';
    }

    var nodes = unique(assets.map(node));
    nodes.forEach(function(node) {
        var refs = assets.filter(function(a) {
            return a.node === node;
        });

        var offset = 0,
            value = node.value,
            converted = '';

        refs.forEach(function(asset) {
            var pos = asset.position;
            var url = asset.dest ? outputUrl + asset.dest : asset.url;
            converted += value.substring(offset, pos.index);
            converted += 'url(' + url + ')';
            offset = pos.index + pos.length;
        });

        converted += value.substring(offset);
        node.value = converted;
    });
}
