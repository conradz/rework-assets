# rework-assets

[![Build Status](https://drone.io/github.com/conradz/rework-assets/status.png)](https://drone.io/github.com/conradz/rework-assets/latest)

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

 * `src`: The directory where the CSS source files are located. Defaults to
     the current directory.
 * `dest`: The output folder that will contain the copied assets. Defaults to
     the current directory.
 * `prefix`: The URL that is used to prefix the urls from the
     generated CSS.  Defaults to empty.
 * `onError`: A function that is called whenever an error occurs whil reading a
     file. This function can simply ignore the error if desired, which causes the
     URL to be unchanged from the source file. The default function throws the
     error.
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

## Example complete `build-css` script

```js
#!/usr/bin/env node

var readSync = require('fs').readFileSync;
var path = require('path');
var rework = require('rework');

// Rework plugins
var imports = require('rework-npm');
var assets = require('rework-assets');
var inherit = require('rework-inherit');
var autoprefixer = require('autoprefixer');

// `$ build-css src/index.css > build/build.css`
process.stdout.write(build( process.argv[2] ));

function build (file) {
    var styles = readSync(file, 'utf-8');

    return rework(styles)
        .use(imports({
            dir: path.dirname(file)
        }))
        .use(assets({
            src: path.dirname(file),
            dest: path.join(__dirname, '../build/assets'),
            func: 'asset',
            prefix: 'assets/',
            onError: console.error
        }))
        .use(inherit())
        .use(autoprefixer([ 'last 2 versions' ]).rework)
        .toString();
}
```
