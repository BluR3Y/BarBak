import Head from 'next/head';
import React from 'react';
import Router from 'next/router';
import axios from 'axios';
import Link from 'next/link';

import { connect } from 'react-redux';
import { setUserInfo, setUserProfileImage } from '@/redux/actions';

import { StyledLogin, AssistLink } from '@/styles/pages/login';
import { AuthenticationForm } from '@/styles/components/shared/authForm';
import { StyledSubmitBtn } from '@/styles/components/register/submitBtn';
import { RedirectContainer } from '@/styles/components/shared/authRedirect';

import { StyledLogo } from '@/styles/components/shared/logo';
import SlideShow from '@/components/shared/slideshow';
import AuthInput from '@/components/shared/authInput';
import { withOutAuth } from '@/components/hocs/authWrapper';


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

            if (!email.length || !password.length) {
                const errorObj = new Error('Empty Fields');
                errorObj.errors = [];
                if (!email.length)
                    errorObj.errors.push({ path: 'user', type: 'empty', message: 'Field is empty' });
                if (!password.length)
                    errorObj.errors.push({ path: 'password', type: 'empty', message: 'Field is empty' });
                throw errorObj;
            }

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
            if (data.profile_image)
                await this.fetchProfileImage(barbak_backend_uri + data.profile_image);

            // To prevent users from returning to login page, replace login page path with home page path in browser's history
            window.history.replaceState({}, '', '/');
            Router.push('/');
        } catch(err) {
            if (err.name === "AxiosError") {
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
            } else {
                const errors = err.errors;
                for (const error in errors) {
                    switch (errors[error].path) {
                        case 'user':
                            this.setState({ emailError: errors[error].message });
                            break;
                        case 'password':
                            this.setState({ passwordError: errors[error].message });
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    fetchProfileImage = async (url) => {
        try {
            const { updateUserProfileImage } = this.props;
            const reader = new FileReader();
            reader.onloadend = () => {
                updateUserProfileImage(reader.result);
            };

            const { data } = await axios.get(url, { withCredentials: true, responseType: 'blob' });
            reader.readAsDataURL(data);
        } catch(err) {
            console.log('error fetching profile image');
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
        updateUserInfo: (userInfo) => dispatch(setUserInfo(userInfo)),
        updateUserProfileImage: (profileImage) => dispatch(setUserProfileImage(profileImage))
    }
}

export default withOutAuth(connect(mapStateToProps, mapDispatchToProps)(Login), '/');