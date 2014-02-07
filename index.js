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

  options.base = path.resolve(options.base || '.');
  options.output = path.resolve(options.output || '.');
  options.outputUrl = options.outputUrl || options.output;
  options.onError = options.onError || defaultError;
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
  if (tree.stylesheet) {
    return find(tree.stylesheet, func);
  }

  var styles = tree,
    assets = [];

  if (styles.declarations) {
    styles.declarations.forEach(function(d) {
      var pattern = new RegExp(func + '\((\'[^\')+\'|"[^"]+"|[^\)]+)\)', 'g'),
        m;
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
      output = options.output,
      base = options.base,
      onError = options.onError;

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
