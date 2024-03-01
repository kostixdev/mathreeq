const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {

  entry: [
    './example/main.ts'
  ],

  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // {
      //   test: /\.(ttf)$/i,
      //   use: [
      //     {
      //       loader: 'file-loader',
      //       // options: {
      //       //   name: '[path][name].[ext]',
      //       //   // outputPath: 'fonts/'
      //       // }
      //     }
      //   ]
      // }
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ]
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },

  plugins: [

    new HtmlWebpackPlugin({
      title: 'mathreeq digital rain project', 
      template: 'example/index.html'
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, 'example', 'asset'),
          to: path.join(__dirname, 'dist', 'asset')
        }
      ],
    }),

  ],

  devServer: {
    static: path.join(__dirname, 'dist'),
    compress: true,
    port: 4000,
  },

};