import React from 'react';
import Router from 'next/router';
import { getCookie } from '@/utils/component/methods';
import { connect } from 'react-redux';
import { setUserInfo } from '@/redux/actions';
import axios from 'axios';

export const withAuth = ( WrappedComponent, redirectPath = '/' ) => {
    class Authentication extends React.Component {
        static async getInitialProps(ctx) {
            try {
                const sessionToken = getCookie(ctx.req.headers.cookie, 'session');
                if (!sessionToken)
                    throw new Error('User Not Authenticated');
                const { data } = await axios.get(process.env.BARBAK_BACKEND + '/users/check-session', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'cookie': `session=${sessionToken}`
                    }
                });
                
                return { user: data };
            } catch(err) {
                return {
                    user: null,
                    wrappedProps: WrappedComponent.getInitialProps && (await WrappedComponent.getInitialProps(ctx))
                }
            }
        }

        componentDidMount() {
            const { user, updateUserInfo } = this.props;
            updateUserInfo(user);
            if (!user)
                Router.push(redirectPath);
        }

        render() {
            return <WrappedComponent {...this.props.wrappedProps} />
        }
    }
    const mapDispatchToProps = (dispatch) => {
        return {
            updateUserInfo: (userInfo) => dispatch(setUserInfo(userInfo))
        };
    }
    return connect(null, mapDispatchToProps)(Authentication);
}

export const withOutAuth = ( WrappedComponent, redirectPath = '/' ) => {
    class Authentication extends React.Component {
        static async getInitialProps(ctx) {
            try {
                const sessionToken = getCookie(ctx.req.headers.cookie, 'session');
                if (!sessionToken)
                    throw new Error('User Not Authenticated');
                const { data } = await axios.get(process.env.BARBAK_BACKEND + '/users/check-session', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'cookie': `session=${sessionToken}`
                    }
                });
                
                return { user: data };
            } catch(err) {
                return {
                    user: null,
                    wrappedProps: WrappedComponent.getInitialProps && (await WrappedComponent.getInitialProps(ctx))
                }
            }
        }

        componentDidMount() {
            const { user, updateUserInfo } = this.props;
            updateUserInfo(user);
            if (user)
                Router.push(redirectPath);
        }

        render() {
            return <WrappedComponent {...this.props.wrappedProps} />
        }
    }
    const mapDispatchToProps = (dispatch) => {
        return {
            updateUserInfo: (userInfo) => dispatch(setUserInfo(userInfo))
        };
    }
    return connect(null, mapDispatchToProps)(Authentication);
}