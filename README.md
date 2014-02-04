# rework-assets

Copy all assets referenced by the CSS document to a folder, updating the CSS
references.

## Example

```js
var rework = require('rework'),
    assets = require('rework-assets');

var css = ...;

css = rework(css)
    .use(assets({
        base: 'src',
        output: 'assets'
    }))
    .toString();

// all assets are copied to the `assets` folder, which is referenced by all
// `url(...)` calls in the generated CSS
```

## Reference

### `assets(options)`

Returns a new rework plugin function that will copy all the assets referenced by the CSS document to a folder. `options` may contain the following values:

 * `base`: The base folder where the CSS source files are located. Defaults to
   the current directory.
 * `output`: The output folder that will contain the copied assets. Defaults to
   the current directory.
 * `outputUrl`: The URL that is used to reference the output directory from the
   generated CSS.  Defaults to the value of `output`, or empty if not
   specified.

The path to each asset source is determined by the `base` directory and the
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
