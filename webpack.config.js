/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable no-undef */

// https://github.com/Microsoft/TypeScript-Babel-Starter
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { DuplicatesPlugin } = require('inspectpack/plugin');
// https://github.com/arcanis/pnp-webpack-plugin
const PnpWebpackPlugin = require(`pnp-webpack-plugin`);
// https://github.com/webpack-contrib/copy-webpack-plugin
const CopyPlugin = require('copy-webpack-plugin');

/**
 * output errors on watch
 * @see https://stackoverflow.com/a/39142422/1465919
 */
class ConsoleNotifierPlugin {
    compilationDone(stats) {
        const log = error => {
            console.error(error.error ? error.error : error);
        };
        stats.compilation.errors.forEach(log);
    }

    apply(compiler) {
        compiler.plugin('done', this.compilationDone.bind(this));
    }
}

module.exports = env => {
    return {
        optimization: {
            minimizer: [
                new TerserPlugin({
                    sourceMap: !env.production,
                    terserOptions: {
                        ecma: undefined,
                        warnings: true,
                        parse: {},
                        compress: {},
                        mangle: true, // Note `mangle.properties` is `false` by default.
                        module: false,
                        output: {
                            comments: false,
                        },
                        toplevel: false,
                        nameCache: null,
                        ie8: false,
                        keep_classnames: undefined,
                        keep_fnames: false,
                        safari10: true,
                    },
                }),
            ],
            splitChunks: {
                automaticNameDelimiter: '.',
                chunks: 'all',
            },
        },
        // Change to your "entry-point".
        entry: ['./assets/ts/main.ts'],
        devtool: env.production ? '' : 'inline-source-map',
        mode: env.production ? 'production' : 'development',
        output: {
            filename: '[name].bundle.js',
            chunkFilename: '[name].bundle.js',
            path: path.resolve(__dirname, 'assets/js'),
        },
        resolve: {
            modules: ['node_modules'],
            extensions: ['.ts', '.tsx', '.js', '.json'],
            symlinks: true,
            plugins: [PnpWebpackPlugin],
        },
        resolveLoader: {
            plugins: [PnpWebpackPlugin.moduleLoader(module)],
        },
        module: {
            rules: [
                // typescript and javascript
                {
                    test: /\.(tsx?)|\.(js)$/,
                    exclude: [/node_modules\/(?!@ribajs)/, /(bower_components)/],
                    loader: require.resolve('babel-loader'),
                },
                // html templates
                {
                    test: /\.html$/,
                    use: [
                        {
                            loader: 'html-loader',
                            options: {
                                minimize: true,
                            },
                        },
                    ],
                },
                // pug templates
                {
                    test: /\.pug$/,
                    use: [
                        {
                            loader: 'pug-loader',
                            options: {
                                minimize: true,
                            },
                        },
                    ],
                },
            ],
        },
        plugins: [
            new ConsoleNotifierPlugin(),
            new DuplicatesPlugin(),
            new CopyPlugin([
                // Copy bootstrap scss files. Note: `require.resolve('bootstrap')` resolves to `'bootstrap/dist/js/bootstrap.js'` because this is the main file in package.json
                {
                    from: path.resolve(path.dirname(require.resolve('bootstrap')), '../../scss'),
                    to: path.resolve('./assets/scss/vendors/bootstrap/'),
                    toType: 'dir',
                },
                // Copy @ribajs/bs4 scss files
                {
                    from: path.dirname(require.resolve('@ribajs/bs4')) + '/**/*.scss',
                    to: path.resolve('./assets/scss/vendors/@ribajs/bs4'),
                    toType: 'dir',
                    context: path.dirname(require.resolve('@ribajs/bs4')),
                },
                // Copy @ribajs/pdf scss files
                {
                  from: path.dirname(require.resolve('@ribajs/pdf')) + '/**/*.scss',
                  to: path.resolve('./assets/scss/vendors/@ribajs/pdf'),
                  toType: 'dir',
                  context: path.dirname(require.resolve('@ribajs/pdf')),
              },
                // Copy iconset svg's
                {
                    from: path.resolve(path.dirname(require.resolve('@ribajs/iconset')), 'svg'),
                    to: path.resolve('./assets/iconset/'),
                    toType: 'dir',
                    context: path.dirname(require.resolve('@ribajs/iconset')),
                },
            ]),
        ],
    };
};
