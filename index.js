var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    crypto = require('crypto'),
    find = require('css-find-assets'),
    unique = require('mout/array/unique'),
    contains = require('mout/array/contains'),
    url = require('url');

module.exports = assets;

function assets(options) {
    return function(style) {
        process(options, style);
    };
}

function process(options, style) {
    var base = path.resolve(options.base || '.'),
        output = path.resolve(options.output || '.'),
        outputUrl = options.outputUrl || options.output,
        onError = options.onError || defaultError;

    var assets = find(style).filter(relativeUrl);
    copyAssets(assets, options);
    rewriteAssets(assets, options);
}

function node(asset) {
    return asset.node;
}

function relativeUrl(asset) {
    var u = url.parse(asset.url);
    return !u.protocol;
}

function defaultError(err) {
    throw err;
}

function copyAssets(assets, options) {
    var base = path.resolve(options.base || '.'),
        output = path.resolve(options.output || '.'),
        onError = options.onError || defaultError,
        copied = [];

    mkdirp.sync(output);

    assets.forEach(function(asset) {
        var node = asset.node,
            source = node.position && node.position.source;

        source = path.join(
            (source ? path.resolve(base, path.dirname(source)) : base),
            asset.url);

        var contents;
        try {
            contents = fs.readFileSync(source);
        } catch (err) {
            onError(err);
            asset.dest = null;
            return;
        }

        var hash = crypto.createHash('sha1')
                .update(contents)
                .digest('hex')
                .substr(0, 16),
            dest = hash + path.extname(asset.url);

        if (!contains(copied, dest)) {
            copied.push(dest);
            fs.writeFileSync(
                path.join(output, dest),
                contents);
        }

        asset.dest = dest;
    });
}

function rewriteAssets(assets, options) {
    var outputUrl = options.outputUrl || options.output || '';
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
            var pos = asset.position,
                dest = asset.dest ? outputUrl + asset.dest : asset.url;
            converted += value.substring(offset, pos.index);
            converted += 'url(' + dest + ')';
            offset = pos.index + pos.length;
        });

        converted += value.substring(offset);
        node.value = converted;
    });
}
