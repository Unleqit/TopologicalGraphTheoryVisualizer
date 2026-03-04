import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoName = 'TopologicalGraphTheoryVisualizer';

export default {
  mode: 'production',

  entry: {
    index: './src/pages/index.ts',
    intro: './src/pages/intro.ts',
    planarity: './src/pages/planarity.ts',
    surfaces: './src/pages/surfaces.ts',
  },

  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),

    publicPath: `/${repoName}/`,

    clean: true,
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
      {
        test: /\.py$/,
        type: 'asset/source',
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './public/index.html',
      chunks: ['index'],
      inject: 'body',
    }),

    new HtmlWebpackPlugin({
      filename: 'intro.html',
      template: './public/intro.html',
      chunks: ['intro'],
      inject: 'body',
    }),

    new HtmlWebpackPlugin({
      filename: 'planarity.html',
      template: './public/planarity.html',
      chunks: ['planarity'],
      inject: 'body',
    }),

    new HtmlWebpackPlugin({
      filename: 'surfaces.html',
      template: './public/surfaces.html',
      chunks: ['surfaces'],
      inject: 'body',
    }),
  ],

  devtool: false,
};
