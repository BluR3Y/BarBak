import React from 'react';
import Router from 'next/router';
import { getCookie } from '@/utils/methods';
import { connect } from 'react-redux';
import { setUserInfo } from '@/redux/actions';

export const withAuth = ( WrappedComponent, redirectPath = '/' ) => {
    class Authentication extends React.Component {
        static async getInitialProps(ctx) {
            try {
                const sessionToken = getCookie(ctx.req.headers.cookie, 'session');
                
                if (!sessionToken)
                    throw new Error('User Not Authenticated');
                const res = await fetch(process.env.BARBAK_BACKEND + '/users/check-session', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'cookie': `session=${sessionToken}`
                    }
                });
                if (res.status !== 200)
                    throw new Error('User Not Authenticated');
                
                const componentProps = WrappedComponent.getInitialProps && (await WrappedComponent.getInitialProps(ctx));
                componentProps.user = await res.json();

                return {...componentProps};
            } catch (err) {
                return { user:null }
            }
        }

        componentDidMount() {
            const { user, updateUserInfo } = this.props;
            const { userId = null, username = null, email = null, profile_image = null, experience = null } = user ? user : {};
            updateUserInfo({
                user_id: userId,
                user_name: username,
                user_email: email,
                user_profile_image: profile_image,
                user_experience: experience
            });

            if (!user)
                Router.push(redirectPath);
        }

        render() {
            return <WrappedComponent {...this.props} />
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
                const res = await fetch(process.env.BARBAK_BACKEND + '/users/check-session', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'cookie': `session=${sessionToken}`
                    }
                });
                if (res.status !== 200)
                    throw new Error('User Not Authenticated');

                return {
                    user: await res.json(),
                    wrappedProps: WrappedComponent.getInitialProps && (await WrappedComponent.getInitialProps(ctx))
                };
            } catch (err) {
                return { user:null }
            }
        }

        componentDidMount() {
            const { user, updateUserInfo } = this.props;
            const { userId = null, username = null, email = null, profile_image = null, experience = null } = user ? user : {};
            updateUserInfo({
                user_id: userId,
                user_name: username,
                user_email: email,
                user_profile_image: profile_image,
                user_experience: experience
            });
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