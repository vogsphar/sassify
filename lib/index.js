"use strict";

var sass = require("node-sass");
var path = require("path");
var extend = require('util')._extend;
var tools = require('browserify-transform-tools');
var moduleImporter = require('sass-module-importer');

module.exports = tools.makeStringTransform('sassify', {
    includeExtensions: ['.css', '.sass', '.scss'],
    evaluateArguments: true
}, function(content, opts, done) {
    var inject = !(opts.config || {})['no-auto-inject']

    var file = opts.file;

    var options = extend({
        sourceComments : false,
        sourceMap : false,
        sourceMapEmbed : false,
        sourceMapContents : false,
        base64Encode : false,
        importer: null
    }, opts.config || {});

    options.includePaths = extend([], (opts.config ? opts.config.includePaths : []) || []);
    options.includePaths.unshift(path.dirname(opts.file));
    options.indentedSyntax = /\.sass$/i.test(opts.file);
    options.file = file;
    options.data = content;
    options.outFile = opts.file;

    // TODO: this could be a function not a string...
    if (options.importer) {
        if ((path.resolve(options.importer) === path.normalize(options.importer).replace(/(.+)([\/|\\])$/, '$1'))) {
            options.importer = require(options.importer);
        } else {
            options.importer = require(path.resolve(options.importer));
        }
    }else{
        options.importer = moduleImporter();
    }

    var callback = function (error,css) {
        if(error) {
            return done(error);
        }
        var exp;
        if (inject) {
            if(options.base64Encode) {
                exp = "require('" + path.basename(path.dirname(__dirname)) + "').byUrl('" + (function() {
                        var b64 = css.css.toString('base64');
                        return 'data:text/css;base64,' + b64;
                    })() + "');";
            } else {
                exp = "require('" + path.basename(path.dirname(__dirname)) + "')(" + JSON.stringify(css.css.toString()) + ");";
            }
        } else {
            exp = JSON.stringify(css.css.toString());
        }
        var out = "module.exports = " + exp + ";";

        done(null, out);
    };

    sass.render(options, callback);
});
