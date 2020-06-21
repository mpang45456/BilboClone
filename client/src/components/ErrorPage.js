import React from 'react';
import { Result, Button } from 'antd';

// TODO: Update with specific error messages (e.g. 404 not found etc.)
/**
 * Error Page component rendered within the
 * <Content /> element in `AppScaffold`
 */
export default function ErrorPage(props) {
    return (
        <Result status='warning'
                title='There was a problem with your operation'
                extra={
                    <Button>This does nothing (for now...)</Button>
                }>
        </Result>
    );
}
