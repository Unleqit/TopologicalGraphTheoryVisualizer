import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  entry: {
    index: './src/pages/landing-page/index.ts',
    intro: './src/pages/intro-page/intro.ts',
    planarity: './src/pages/planarity-page/planarity.ts',
    surfaces: './src/pages/surface-page/surfaces.ts',
  },
  output: { filename: '[name].bundle.js', path: path.resolve(__dirname, 'dist'), publicPath: '/', clean: true },
  resolve: { extensions: ['.ts', '.js'] },
  module: {
    rules: [
      { test: /\.ts$/, use: [{ loader: 'ts-loader', options: { compilerOptions: { sourceMap: true, inlineSources: true } } }], exclude: /node_modules/ },
      { test: /\.css$/i, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
      { test: /\.py$/, type: 'asset/source' },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].css' }),
    new HtmlWebpackPlugin({ filename: 'index.html', template: './public/index.html', chunks: ['index'], inject: 'body' }),
    new HtmlWebpackPlugin({ filename: 'intro.html', template: './public/intro.html', chunks: ['intro'], inject: 'body' }),
    new HtmlWebpackPlugin({ filename: 'planarity.html', template: './public/planarity.html', chunks: ['planarity'], inject: 'body' }),
    new HtmlWebpackPlugin({ filename: 'surfaces.html', template: './public/surfaces.html', chunks: ['surfaces'], inject: 'body' }),
  ],
  devtool: 'source-map',
  watch: false,
};
