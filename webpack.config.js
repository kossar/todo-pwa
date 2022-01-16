'use strict'

const {WebpackPluginServe: Serve} = require('webpack-plugin-serve');
const path = require('path');

const options = {
    compress: true,
    client: {
        silent: false
    },
    port: 8090,
    static: ['./dist', './wwwroot'],
}

module.exports = {
    mode: 'development',
    entry: {
        'app': ['./src/app.ts', 
        'webpack-plugin-serve/client']
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                loader: 'ts-loader',
                test: /\.tsx?$/
            }
        ]
    },
    plugins: [
        new Serve(options)
    ],
    watch: true,
}
