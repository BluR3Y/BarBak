import Head from 'next/head';
import React from 'react';
import { StyledLogin, AuthenticationForm, SubmitBtn, AssistLink } from '@/styles/pages/login';
import Logo from '@/components/logo';

import SlideShow from '@/components/slideshow';
import AuthInput from '@/components/authInput';
import { withOutAuth } from '@/hocs/authWrapper';

import { connect } from 'react-redux';
import { setUserInfo } from '@/redux/actions';

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
    
    componentDidMount() {
        console.log(this.props.userId)
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
        event.preventDefault();
        const { email, password } = this.state;

        try {
            const loginResponse = await fetch('http://localhost:3001/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: email,
                    password
                })
            });
            const resData = await loginResponse.json();
            if (!loginResponse.ok) {
                const errorObj = new Error(loginResponse.statusText);
                errorObj.info = await resData;
                throw errorObj;
            }
        } catch (err) {
            console.log(err)
        }
    }

    handleTesting = async (event) => {
        event.preventDefault();
        const { updateUserInfo } = this.props;
        updateUserInfo({
            user_id: 123456,
            user_name: 'blu-rey',
            user_email: 'rey@gmail.com',
            user_profile_image: 'abc123'
        });
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
                        <Logo
                            onClick={this.handleTesting}
                        />
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
                </div>
            </StyledLogin>
        </>)
    }
}

const mapStateToProps = (state) => {
    return {
        userId: state.userReducer.user_id
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        updateUserInfo: (userInfo) => dispatch(setUserInfo(userInfo))
    }
}

export default withOutAuth(connect(mapStateToProps, mapDispatchToProps)(Login), '/');
// export default withOutAuth( Login, '/' );