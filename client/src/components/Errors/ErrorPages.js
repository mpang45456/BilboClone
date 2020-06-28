import React from 'react';
import { Result } from 'antd';

/**
 * Error Component for Status Code 400
 * 
 * * Note: This component is rendered within the
 * <Content /> element in `AppScaffold`.
 */
export function Error400(props) {
    return (
        <Result status='warning'
                title="Sorry... Your request was malformed or disallowed."
                extra={
                    <span>Check your request's fields again</span>
                }>
        </Result>
    );
}

/**
 * Error Component for Status Code 403
 * 
 * * Note: This component is rendered within the
 * <Content /> element in `AppScaffold`.
 */
export function Error403(props) {
    return (
        <Result status='warning'
                title="Hmm... Seems like you're not authorized to access this resource"
                extra={
                    <span>Contact your System Administrator to request for access</span>
                }>
        </Result>
    );
}

/**
 * Error Component for Status Code 400
 * 
 * Note: This component is rendered within the
 * <Content /> element in `AppScaffold`.
 * 
 * Note: This is for dealing with navigational errors
 * as well (i.e. a URL that does not correspond with 
 * any of React Router's paths)
 */
export function Error404(props) {
    return (
        <Result status='warning'
                title='Err... This resource does not exist'
                extra={
                    <span>Please check your URL</span>
                }>
        </Result>
    );
}

/**
 * Error Component for Status Code 500
 * 
 * * Note: This component is rendered within the
 * <Content /> element in `AppScaffold`.
 */
export function Error500(props) {
    return (
        <Result status='warning'
                title='Oops, something went wrong!'
                extra={
                    <span>Contact your System Administrator about this issue</span>
                }>
        </Result>
    );
}
