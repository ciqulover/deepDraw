const baseConfig = require('./webpack.base.config')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = merge(baseConfig, {
  devtool: 'source-map',
  devServer: {
    port: 7000,
    hot: false,
    open: true,
    contentBase: path.join(__dirname, '../src/mnist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html'),
    }),
  ]
})
