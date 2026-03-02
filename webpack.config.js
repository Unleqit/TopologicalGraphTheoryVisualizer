import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  entry: {
    index: './src/script.ts',
    intro: './src/intro.ts',
    planarity: './src/planarity.ts',
    surfaces: './src/common.ts',
  },

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    devtoolModuleFilenameTemplate: (info) => `webpack://webapp/${info.resourcePath}`,
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './public/index.html',
      chunks: ['index'],
    }),
    new HtmlWebpackPlugin({
      filename: 'intro.html',
      template: './public/intro.html',
      chunks: ['intro'],
    }),
    new HtmlWebpackPlugin({
      filename: 'planarity.html',
      template: './public/planarity.html',
      chunks: ['planarity'],
    }),
    new HtmlWebpackPlugin({
      filename: 'surfaces.html',
      template: './public/surfaces.html',
      chunks: ['surfaces'],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/layout_computation.py', to: '' }, // copies to dist/
      ],
    }),
  ],

  watch: true,
  devtool: 'source-map',
  cache: false,
};
