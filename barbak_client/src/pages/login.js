import Head from 'next/head';
import React from 'react';
import { StyledLogin, AuthenticationForm, SubmitBtn, AssistLink } from '@/styles/pages/login';
import Logo from '@/components/logo';

import SlideShow from '@/components/slideshow';
import AuthInput from '@/components/authInput';

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            emailError: '',
            passwordError: '',
        }
    }

    componentDidMount() {
        fetch('http://localhost:3001/getTest')
        .then(res => console.log(res))
    }

    emailCallback = (email) => {
        this.setState({ email });
    }

    passwordCallback = (password) => {
        this.setState({ password });
    }

    submitLogin = async (event) => {
        event.preventDefault();
        const { email, password } = this.state;
        const loginAttempt = await fetch('http://localhost:3001/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: email,
                password
            })
        })
    }

    render() {
        const { emailCallback, passwordCallback, submitLogin } = this;
        const { email, emailError, password, passwordError } = this.state;
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
                onSubmit={submitLogin}
            >
                <SlideShow
                    images={images}
                />
                <div className='authentication'>
                    <AuthenticationForm>
                        <Logo/>
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
                        <SubmitBtn>Sign In</SubmitBtn>
                    </AuthenticationForm>
                </div>
            </StyledLogin>
        </>)
    }
}