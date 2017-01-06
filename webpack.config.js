var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');
var path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
var glob = require('glob');

const sassLoaders = [
  'css-loader?url=false',
  'postcss-loader',
  'resolve-url',
  'sass-loader?sourceMap&includePaths[]=' + path.resolve(__dirname, './gui'),
]

console.log(glob.sync('**/.babelrc', { cwd: __dirname }).map(function(p) { return path.dirname(p); }));

module.exports = {
  context: path.join(__dirname, "gui-src"),
  devtool: debug ? "source-map" : null,
  entry: { main: "./js/main.js" },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(time-monitor\/node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'es2015', 'stage-0'],
          plugins: ['react-html-attrs', 'transform-class-properties', 'transform-decorators-legacy'],
        }
      },
      {
        test: /time-monitor\/node_modules\/.*\.jsx?$/,
        exclude: /dist/,
        include: glob.sync('**/.babelrc', { cwd: __dirname }).map(function(p) { return path.join(__dirname, path.dirname(p)); }),
        loader: 'babel-loader',
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style-loader', sassLoaders.join('!'))
      },
      {
        test: /\.(jpg|png|gif|svg)$/,
        loader: "ignore"
      }
    ]
  },
  output: {
    path: path.join(__dirname, "gui"),
    filename: "js/[name].js"
  },
  plugins: (debug ? [] : [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
  ]).concat([
    new ExtractTextPlugin('css/[name].css')
  ]),
  resolve: {
    extensions: ['', '.js', '.sass', '.scss'],
    root: [path.join(__dirname, './gui')]
  },
  target: 'web'
};

