var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    crypto = require('crypto'),
    unique = require('mout/array/unique'),
    contains = require('mout/array/contains'),
    url = require('url');

module.exports = assets;

function assets(options) {
    options = options || {};

    options.src = path.resolve(options.src || '.');
    options.onError = options.onError || defaultError;
    options.prefix = options.prefix || '';
    options.func = options.func || 'asset';

    return function(style) {
        process(options, style);
    };
}

function process(options, style) {
    var assets = find(style, options.func).filter(relativeUrl);
    copyAssets(assets, options);
    rewriteAssets(assets, options);
}

function find(tree, func) {
    if (tree.stylesheet) return find(tree.stylesheet, func);

    var styles = tree,
        assets = [],
        // extract the *** from func(***)
        // for example with func === 'url', url(/foo.png) gives '/foo.png'
        // with func === 'asset', asset("/bar.png') gives '/bar.png'
        pattern = new RegExp(func + '\\((\'[^\')+\'|"[^"]+"|[^\\)]+)\\)', 'g');

    if (styles.declarations) {
        styles.declarations.forEach(function(d) {
            var m;

            while ((m = pattern.exec(d.value)) !== null) {
                var url = m[1]
                    .replace(/^['"]|['"]$/g, '')
                    .replace(/[?#].*$/, '');

                assets.push({
                    url: url,
                    node: d,
                    position: {
                        index: m.index,
                        length: m[0].length
                    }
                });
            }
        });
    }

    if (styles.rules) {
        styles.rules.forEach(function(rule) {
            assets = assets.concat(find(rule, func));
        });
    }

    return assets;
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
    var copied = [],
        dest = options.dest,
        src = options.src,
        onError = options.onError;

    mkdirp.sync(dest);

    assets.forEach(function(asset) {
        var node = asset.node;
        var source = node.position && node.position.source;
        var base = source ? path.resolve(src, path.dirname(source)) : src;
        var sourcefile = path.join(base, asset.url);

        var contents;
        try {
            contents = fs.readFileSync(sourcefile);
        } catch (err) {
            onError(err);
            asset.dest = null;
            return;
        }

        var hash = crypto.createHash('sha1')
                .update(contents)
                .digest('hex')
                .substr(0, 16);

        var filename = hash + path.extname(asset.url);
        var destfile = path.join(dest, filename);

        console.error('copying', sourcefile, 'to', destfile);

        if (!contains(copied, hash)) {
            copied.push(hash);
            fs.writeFileSync(destfile, contents);
        }

        asset.hashed = filename;
    });
}

function rewriteAssets(assets, options) {
    var prefix = options.prefix;
    var func = options.func;
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

            converted += value.substring(offset, pos.index);
            converted += asset.hashed
                ? 'url(' + prefix + asset.hashed + ')'
                : func + '(' + asset.url + ')';

            offset = pos.index + pos.length;
        });

        converted += value.substring(offset);
        node.value = converted;
    });
}
