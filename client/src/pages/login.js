import Head from 'next/head';
import React from 'react';
import Router from 'next/router';
import axios from 'axios';
import Link from 'next/link';

import { connect } from 'react-redux';
import { setUserInfo } from '@/redux/actions';

import { StyledLogin, AssistLink } from '@/styles/pages/login';
import { AuthenticationForm } from '@/styles/components/shared/authForm';
import { StyledSubmitBtn } from '@/styles/components/register/submitBtn';
import { RedirectContainer } from '@/styles/components/shared/authRedirect';

import { StyledLogo } from '@/styles/components/shared/logo';
import SlideShow from '@/components/shared/slideshow';
import AuthInput from '@/components/shared/authInput';
import { withOutAuth } from '@/components/hocs/authWrapper';
import { loginValidator } from '@/lib/validations/user-validations';


class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            emailError: '',
            passwordError: '',
            otherError: ''
        }
    }

    static async getInitialProps(ctx) {
        const barbak_backend_uri = process.env.BACKEND_URI;
        return { barbak_backend_uri };
    }

    emailCallback = (email) => {
        if (this.state.emailError)
            this.setState({ emailError: '' });
        this.setState({ email });
    }

    passwordCallback = (password) => {
        if (this.state.passwordError) 
            this.setState({ passwordError: '' });
        this.setState({ password });
    }

    handleSubmit = async (event) => {
        try {
            event.preventDefault();
            const { email, password } = this.state;
            const { barbak_backend_uri, updateUserInfo } = this.props;

            // Validate input data with joi validation object
            const { error } = loginValidator.validate({ username: email, password },{ abortEarly: false, allowUnknown: false });
            if (error) throw error;
            // Make api call to log in user with passed credentials
            const { data } = await axios.post(`${barbak_backend_uri}/accounts/login`, {
                username: email,
                password
            },{ withCredentials: true });
            updateUserInfo(data);
            // To prevent users from returning to login page, replace login page path with home page path in browser's history
            window.history.replaceState({}, '', '/');
            Router.push('/');
        } catch(err) {
            // Resolving error relating to http request
            if (err.name === 'AxiosError') {
                const { data, status } = err.response;
                switch (status) {
                    case 404:
                        this.setState({ emailError: data.message });
                        break;
                    case 401:
                        this.setState({ passwordError: data.message });
                        break;
                    default:
                        this.setState({ otherError: data.message });
                        break;
                }
            }
            // Resolving error relating to field validation
            if (err.name === 'ValidationError') {
                const { details } = err;
                for (const { message, path, type } of details) {
                    switch (path[0]) {
                        case 'username':
                            this.setState(prevState => ({ emailError: prevState.emailError || message }));
                            break;
                        case 'password':
                            this.setState(prevState => ({ passwordError: prevState.passwordError || message }));
                        default:
                            break;
                    }
                }
            }
        }
    }

    render() {
        const { emailCallback, passwordCallback, handleSubmit } = this;
        const { email, emailError, password, passwordError, otherError } = this.state;
        const images = [
            '/images/cocktail-1.jpg',
            '/images/cocktail-2.jpg',
            '/images/cocktail-3.jpg',
            '/images/cocktail-4.jpg',
            '/images/cocktail-5.jpg',
            '/images/cocktail-6.jpg',
            '/images/cocktail-7.jpg',
        ];
        return (<>
            <Head>
                <title>BarBak | Login</title>
            </Head>
            <StyledLogin>
                <SlideShow
                    images={images}
                />
                <div className='authentication'>
                    <AuthenticationForm onSubmit={handleSubmit}>
                        <StyledLogo/>
                        { otherError && <h1 className='otherError'>{otherError}</h1> }
                        <AuthInput
                            labelText={'Email or Username'}
                            errorText={emailError}
                            inputValue={email}
                            inputType={'text'}
                            inputCallback={emailCallback}
                        />
                        <AuthInput
                            labelText={'Password'}
                            errorText={passwordError}
                            inputValue={password}
                            inputType={'password'}
                            inputCallback={passwordCallback}
                        />
                        <AssistLink href='/'>Forgot Password?</AssistLink>
                        <StyledSubmitBtn value='Sign In' />
                    </AuthenticationForm>
                    <RedirectContainer>
                        <h1>Don't have an account? <Link href='/register'>Sign Up</Link></h1>
                    </RedirectContainer>
                </div>
            </StyledLogin>
        </>)
    }
}

const mapStateToProps = (state) => {
    return {
        userInfo: state.userReducer.userInfo
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        updateUserInfo: (userInfo) => dispatch(setUserInfo(userInfo))
    }
}

export default withOutAuth(connect(mapStateToProps, mapDispatchToProps)(Login), '/');