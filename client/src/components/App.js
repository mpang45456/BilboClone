import React from 'react';
import { Button } from 'antd';
// import "antd/dist/antd.css"; //FIXME: Is this necessary?

export default class App extends React.Component {
    render() {
        return (
            <div>
                <Button>Test Button!</Button>
                <h1>This is my React App!</h1>
            </div>
        );
    }
}