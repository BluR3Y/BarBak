import Head from 'next/head';
import React from 'react';
import { StyledLogin, AuthenticationForm, SubmitBtn, AssistLink, RegisterContainer } from '@/styles/pages/login';
import Router from 'next/router';
import Logo from '@/components/logo';

import SlideShow from '@/components/slideshow';
import AuthInput from '@/components/authInput';
import { withOutAuth } from '@/hocs/authWrapper';

import { connect } from 'react-redux';
import { setUserInfo } from '@/redux/actions';
import axios from 'axios';
import Link from 'next/link';

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
        const barbak_backend_uri = process.env.BARBAK_BACKEND;
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

            const {data} = await axios.post(`${barbak_backend_uri}/users/login`, {
                username: email,
                password
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            updateUserInfo(data);
            Router.push('/');
        } catch(err) {
            const errorResponse = err.response;
            if (errorResponse.status === 400) {
                const { data } = errorResponse;
                switch (data.path) {
                    case 'user':
                        this.setState({ emailError: data.message });
                        break;
                    case 'password':
                        this.setState({ passwordError: data.message });
                        break;
                }
            } else if (errorResponse.status === 500) {
                this.setState({ otherError: 'An error occured while processing your request' });
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
            <StyledLogin
                onSubmit={handleSubmit}
            >
                <SlideShow
                    images={images}
                />
                <div className='authentication'>
                    <AuthenticationForm>
                        <Logo/>
                        <h1 className='otherError'>{otherError}</h1>
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
                        <SubmitBtn value='Sign In' />
                    </AuthenticationForm>
                    <RegisterContainer>
                        <h1>Don't have an account? <Link href='/register'>Sign Up</Link></h1>
                    </RegisterContainer>
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