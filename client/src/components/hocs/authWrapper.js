import React from 'react';
import Router from 'next/router';
import { getCookie } from '@/utils/methods';
import { connect } from 'react-redux';
import { setUserInfo } from '@/redux/actions';
import axios from 'axios';

export const withOutAuth = ( WrappedComponent, redirectPath = '/', inverted = false ) => {
    class Authentication extends React.Component {
        static async getInitialProps(ctx) {
            try {
                const sessionToken = getCookie(ctx.req.headers.cookie, 'session');
                if (!sessionToken)
                    throw new Error('User Not Authenticated');
                const { data } = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URI + '/users/@me', {
                    headers: {
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
            if (inverted ? !user : user)
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