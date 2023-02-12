import React from 'react';
import Router from 'next/router';

export const withAuth = ( WrappedComponent, redirectPath = '/') => {
    return class extends React.Component {
        static async getInitialProps(ctx) {
            try {
                const sessionToken = ctx.req.headers.cookie;

                if (!sessionToken)
                    throw new Error('User Not Authenticated');
                const res = await fetch('http://localhost:3001/users/check-session', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'cookie': sessionToken
                    },
                });
                if (res.status !== 200)
                    throw new Error('User Not Authenticated');
                const user = await res.json();
                return {user};
            } catch (err) {
                return { user: null };
            }
        }

        componentDidMount() {
            if (!this.props.user)
                Router.push(redirectPath);
        }

        render() {
            return <WrappedComponent {...this.props} />
        }
    }
}

export const withOutAuth = ( WrappedComponent, redirectPath = '/') => {
    return class extends React.Component {
        static async getInitialProps(ctx) {
            try {
                const sessionToken = ctx.req.headers.cookie;

                if (!sessionToken)
                    throw new Error('User Not Authenticated');
                const res = await fetch('http://localhost:3001/users/check-session', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'cookie': sessionToken
                    },
                });
                if (res.status !== 200)
                    throw new Error('User Not Authenticated');
                const user = await res.json();
                return {user};
            } catch (err) {
                return { user: null };
            }
        }

        componentDidMount() {
            if (this.props.user)
                Router.push(redirectPath);
        }

        render() {
            return <WrappedComponent {...this.props} />
        }
    }
}

// const withAuth = (WrappedComponent) => {
//   return class extends React.Component {
//     static async getInitialProps(ctx) {
//       const componentProps =
//         WrappedComponent.getInitialProps &&
//         (await WrappedComponent.getInitialProps(ctx));

//       if (!ctx.req || ctx.req.session.user) {
//         return { ...componentProps };
//       }

//       if (ctx.res) {
//         ctx.res.writeHead(302, { Location: '/login' });
//         ctx.res.end();
//         return;
//       }

//       Router.push('/login');
//       return { ...componentProps };
//     }

//     render() {
//       return <WrappedComponent {...this.props} />;
//     }
//   };
// };

// export default withAuth;