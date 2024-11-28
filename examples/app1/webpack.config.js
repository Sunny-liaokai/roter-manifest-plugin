const path = require('path');
// html模版插件
const HtmlWebpackPlugin = require('html-webpack-plugin');
// webpack 编译进度条插件
const SimpleProgressPlugin = require('webpack-simple-progress-plugin');

// 路由清单生成
const BuildManifestPlugin = require('build-manifest-plugin');
// css分离
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const devMode = process.env.NODE_ENV !== 'production';
console.log(devMode);

const cssLoaders = [
  devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
  {
    loader: 'css-loader',
    options: {
      modules: {
        auto: true,
        localIdentName: '[folder]__[local]__[hash:base64:5]',
      },
      esModule: false,
    },
  },
  'postcss-loader',
];

module.exports = {
  entry: {
    main: path.join(__dirname, `./src/index.tsx`),
  },
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'chunks/[name]_[chunkhash:8].js',
    clean: true, // webpack4需要配置clean-webpack-plugin来删除dist文件,webpack5内置了
    publicPath: '/', // build构建需要改为 ./
  },
  resolve: {
    //引用以下文件后缀文件可以不带后缀
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve('src'),
    },
  },
  devServer: {
    // historyApiFallback 必须为true 否则会出现页面找不到路由情况
    historyApiFallback: true,
    //开发环境写入dist目录 会影响构建速度
    devMiddleware: {
      writeToDisk: true,
    },
    open: true,
  },
  // devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        include: [path.resolve(__dirname, './src')],
        use: [...cssLoaders],
      },
      {
        test: /\.scss$/,
        include: [path.resolve(__dirname, './src')],
        use: [...cssLoaders, 'sass-loader'],
      },
      {
        test: /\.(ts|tsx)$/,
        // exclude: /node_modules/,
        include: [path.resolve(__dirname, './src')],
        loader: 'babel-loader',
        options: {
          presets: [
            // 从右到左执行
            '@babel/preset-env', //js转最新语法
            '@babel/preset-react', // 转换 JSX
            '@babel/preset-typescript', // 转换 ts
            //@babel/plugin-transform-react-jsx 可以不引入 import React from 'react';
          ],
          cacheDirectory: true, // 加入缓存，减少二次构建时间
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, `./public/index.html`),
      inject: true,
    }),
    devMode
      ? null
      : new MiniCssExtractPlugin({
          filename: 'css/[name]_[contenthash:8].css',
        }),
    new SimpleProgressPlugin(),
    new BuildManifestPlugin({
      routerPath: path.resolve(__dirname, './src/router/index.ts'),
      filename: 'router-manifest.json',
    }),
  ],
};
