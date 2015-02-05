# rework-assets

[![Build Status](https://travis-ci.org/conradz/rework-assets.svg?branch=master)](https://travis-ci.org/conradz/rework-assets)

Copy all assets referenced by the CSS document to a folder, updating the CSS
references.

## Example

```js
var rework = require('rework'),
    assets = require('rework-assets');

var css = ...;

css = rework(css)
    .use(assets({
        src: 'src',
        dest: 'assets'
    }))
    .toString();

// all assets are copied to the `assets` folder, which is referenced by all
// `url(...)` calls in the generated CSS
```

## Reference

### `assets(options)`

Returns a new rework plugin function that will copy all the assets referenced
by the CSS document to a folder. `options` may contain the following values:

 * `src`: The directory where the CSS source files are located. Defaults to the
   current directory.
 * `dest`: The output folder that will contain the copied assets. Defaults to
   the current directory.
 * `prefix`: The URL that is used to prefix the urls from the generated CSS.
   Defaults to empty.
 * `retainName`: Append hash to the original asset name to make identification easier,
   rather than naming solely based on hash.
   Defaults to true.
 * `onError`: A function that is called whenever an error occurs whil reading a
   file. This function can simply ignore the error if desired, which causes the
   URL to be unchanged from the source file. The default function throws the
   error.
 * `onFile`: A function that is called whenever a file is included. It is called
   with the file path. This can be used for tracking which files are referenced
   from the stylesheet.
 * `func`: The name of the CSS function that references an asset in the input.
   Defaults to `'url'`. For example, if `func: 'asset'` is specified, all
   `asset(...)` calls will be found in the input and the copied to the output.
   The output CSS will always use `url(...)` to reference the copied assets in
   the build output.

The path to each asset source is determined by the `src` directory and the
`position.source` property of each node that is set when parsing with
[css-parse](https://github.com/reworkcss/css-parse) if position tracking is
enabled (this is the same information used for generating source maps). This
means that even if the source document is parsed from several files (for
example when using [rework-npm](https://github.com/conradz/rework-npm)), it
will still resolve the referenced asset using the source file path.

The destination file name is derived from a hash of the source file with the
source extension appended. This allows multiple files to reference assets with
the same name but different path. It also deduplicates files originating from
multiple sources but containing the same content.

## Example build script

This is an example build script, showing how to use `rework-assets` in
conjunction with other rework plugins. You can create your own build script
using Node.js directory or you can use a build tool such as
[Grunt](http://gruntjs.com/) or [Gulp](http://gulpjs.com/).

```js
#!/usr/bin/env node

var readSync = require('fs').readFileSync,
    path = require('path'),
    rework = require('rework');

// Rework plugins
var imports = require('rework-npm'),
    assets = require('rework-assets'),
    inherit = require('rework-inherit');

// `$ build-css src/index.css > build/build.css`
process.stdout.write(build(process.argv[2]));

function build (file) {
    var styles = readSync(file, 'utf8'),
        dir = path.dirname(file);

    return rework(styles)
        .use(imports({ dir: dir }))
        .use(assets({
            src: dir,
            dest: path.join(__dirname, '../build/assets'),
            prefix: 'assets/',
            onError: console.error
        }))
        .use(inherit())
        .toString();
}
```
