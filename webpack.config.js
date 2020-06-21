const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './client/src/index.js',
    output: {
        path: path.join(__dirname, '/client/dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: [{
                    loader: 'style-loader',
                }, {
                    loader: 'css-loader', // translates CSS into CommonJS
                }, {
                    loader: 'less-loader', // compiles Less to CSS
                    options: {
                        lessOptions: { // If you are using less-loader@5 please spread the lessOptions to options directly
                            modifyVars: {
                                // TODO: Modify ant-design theming here
                                // 'body-background': '#F3F2F0',
                                // 'primary-color': '#A41304',
                                // 'component-background': '#A41304',
                                // 'link-color': '#1DA57A',
                                // 'border-radius-base': '2px',
                            },
                            javascriptEnabled: true,
                        },
                    },
                }]
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './client/src/index.html'
        })
    ],
    devServer: {
        historyApiFallback: true
    }
}