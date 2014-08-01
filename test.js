var test = require('tap').test,
    rework = require('rework'),
    reworkNpm = require('rework-npm'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    assets = require('./');

// Hash of the fixtures/test.txt file
var HASH = 'test-a94a8fe5ccb19ba6';
var SHORT_HASH = 'a94a8fe5ccb19ba6';

test('copy asset files to directory', function(t) {
    rimraf.sync('build');

    var result = rework('.test { test: url(test.txt); }')
        .use(assets({
            src: 'fixtures',
            dest: 'build'
        }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(' + HASH + '.txt);',
        '}'
    ].join('\n'));

    t.ok(
        fs.existsSync('build/' + HASH + '.txt'),
        'copied file');

    t.end();
});

test('options.retainName', function(t) {
    rimraf.sync('build');

    var result = rework('.test { test: url(test.txt); }')
        .use(assets({
            src: 'fixtures',
            dest: 'build',
            retainName: false
        }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(' + SHORT_HASH + '.txt);',
        '}'
    ].join('\n'));

    t.ok(
        fs.existsSync('build/' + SHORT_HASH + '.txt'),
        'copied file');

    t.end();
});

test('use different outputUrl', function(t) {
    rimraf.sync('build');

    var result = rework('.test { test: url(test.txt); }')
        .use(assets({
            src: 'fixtures',
            dest: 'build',
            prefix: 'test/'
        }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(test/' + HASH + '.txt);',
        '}'
    ].join('\n'));

    t.ok(
        fs.existsSync('build/' + HASH + '.txt'),
        'copied file');

    t.end();
});

test('copy assets from nested directory', function(t) {
    rimraf.sync('build');

    var result = rework('.test { test: url(fixtures/test.txt); }')
        .use(assets({ dest: 'build' }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(' + HASH + '.txt);',
        '}'
    ].join('\n'));

    t.ok(
        fs.existsSync('build/' + HASH + '.txt'),
        'copied file');

    t.end();
});

test('replace multiple url calls', function(t) {
    rimraf.sync('build');

    var src = [
        '.test {',
        '  test: foo url(test.txt), url(test.txt) bar;',
        '}'
    ].join('\n');

    var result = rework(src)
        .use(assets({
            src: 'fixtures',
            dest: 'build'
        }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: foo url(' + HASH + '.txt), ' +
            'url(' + HASH + '.txt) bar;',
        '}'
    ].join('\n'));

    t.end();
});

test('use with importing modules', function(t) {
    rimraf.sync('build');

    var result = rework('@import "./fixtures/test.css";')
        .use(reworkNpm())
        .use(assets({ dest: 'build' }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(' + HASH + '.txt);',
        '}'
    ].join('\n'));

    t.ok(fs.existsSync('build/' + HASH + '.txt'), 'copied file');

    t.end();
});

test('do not copy absolute URLs', function(t) {
    rimraf.sync('build');

    var src = [
        '.test {',
        '  test: url(http://example.com/test.txt);',
        '}'
    ].join('\n');

    var result = rework(src)
        .use(assets({ dest: 'build' }))
        .toString();

    t.equal(result, src);
    t.notOk(fs.existsSync('build'));
    t.end();
});

test('do not copy data URLs', function(t) {
    rimraf.sync('build');

    var src = [
        '.test {',
        '  test: url(data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D);',
        '}'
    ].join('\n');

    var result = rework(src)
        .use(assets({ dest: 'build' }))
        .toString();

    t.equal(result, src);
    t.notOk(fs.existsSync('build'));
    t.end();
});

test('do not copy files with no url', function(t) {
    rimraf.sync('build');

    var src = [
        '.test {',
        '  test: url(#test);',
        '}'
    ].join('\n');

    var result = rework(src)
        .use(assets({ dest: 'build' }))
        .toString();

    t.equal(result, src);
    t.notOk(fs.existsSync('build'));
    t.end();
})

test('allow onError to ignore errors', function(t) {
    rimraf.sync('build');

    var src = [
        '.test {',
        '  test: url(missing.txt);',
        '}'
    ].join('\n');

    var error = null;
    function onError(err) {
        error = err;
    }

    var result = rework(src)
        .use(assets({ dest: 'build', onError: onError }))
        .toString();

    t.ok(error, 'passed error to onError function');
    t.equal(result, src);
    t.notOk(fs.existsSync('build'));
    t.end();
});

test('accept a custom function instead of url()', function(t) {
    rimraf.sync('build');

    var src = [
        '.test {',
        '  test: asset(test.txt);',
        '}'
    ].join('\n');

    var result = rework(src)
        .use(assets({
            src: 'fixtures',
            dest: 'build',
            func: 'asset'
        }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(' + HASH + '.txt);',
        '}'
    ].join('\n'));

    t.end();
});

test('persist url parameters in assets', function(t) {
    rimraf.sync('build');

    var src = [
        '.test {',
        '  test: url(test.txt?test#hash);',
        '}'
    ].join('\n');

    var result = rework(src)
        .use(assets({ src: 'fixtures', dest: 'build' }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(' + HASH + '.txt?test#hash);',
        '}'
    ].join('\n'));

    t.end();
});
