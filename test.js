var test = require('tap').test,
    rework = require('rework'),
    reworkNpm = require('rework-npm'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    assets = require('./');

// Hash of the fixtures/test.txt file
var HASH = 'a94a8fe5ccb19ba6';

test('copy asset files to directory', function(t) {
    rimraf.sync('build');

    var result = rework('.test { test: url(test.txt); }')
        .use(assets({
            base: 'fixtures',
            output: 'build'
        }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(build/' + HASH + '.txt);',
        '}'
    ].join('\n'));

    t.ok(
        fs.existsSync('build/' + HASH + '.txt'),
        'copied file');

    t.end();
});

test('use different outputUrl', function(t) {
    rimraf.sync('build');

    var result = rework('.test { test: url(test.txt); }')
        .use(assets({
            base: 'fixtures',
            output: 'build',
            outputUrl: 'test'
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
        .use(assets({ output: 'build' }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(build/' + HASH + '.txt);',
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
            base: 'fixtures',
            output: 'build'
        }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: foo url(build/' + HASH + '.txt), ' +
            'url(build/' + HASH + '.txt) bar;',
        '}'
    ].join('\n'));

    t.end();
});

test('use with importing modules', function(t) {
    rimraf.sync('build');

    var result = rework('@import "./fixtures/test.css";')
        .use(reworkNpm())
        .use(assets({ output: 'build' }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(build/' + HASH + '.txt);',
        '}'
    ].join('\n'));

    t.ok(fs.existsSync('build/' + HASH + '.txt'), 'copied file');

    t.end();
});

test('skip missing files', function(t) {
    rimraf.sync('build');

    var result = rework('.test { test: url(fixtures/missing.file); }')
        .use(assets({ output: 'build' }))
        .toString();

    t.equal(result, [
        '.test {',
        '  test: url(fixtures/missing.file);',
        '}'
    ].join('\n'));

    t.end();
});
