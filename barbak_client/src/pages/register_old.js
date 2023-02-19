import Head from 'next/head';
import React from "react";
import Router from 'next/router';
import Link from 'next/link';
import axios from 'axios';

import { withOutAuth } from "@/hocs/authWrapper";
import { LoginContainer, RegistrationForm, StyledRegister, SubmitBtn } from "@/styles/pages/register";

import Logo from '@/components/shared/logo';
import SlideShow from '@/components/shared/slideshow';
import AuthInput from '@/components/shared/authInput';

// import { connect } from 'react-redux';
// import { setUserInfo } from '@/redux/actions';

class Register extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            email: '',
            fullname: '',
            fullnameError: '',
            password: '',
            usernameError: '',
            emailError: '',
            passwordError: '',
            otherError: ''
        }
    }

    updateField = ( path, value ) => {
        switch (path) {
            case 'username':
                if (this.state.usernameError.length)
                    this.setState({ usernameError: '', username: value });
                else
                    this.setState({ username: value })
                break;
            case 'email':
                if (this.state.emailError.length)
                    this.setState({ emailError: '', email: value });
                else
                    this.setState({ email: value });
                break;
            case 'fullname':
                if (this.state.fullnameError.length)
                    this.setState({ fullnameError: '', fullname: value });
                else
                    this.setState({ fullname: value });
                break;
            case 'password':
                if (this.state.passwordError.length)
                    this.setState({ passwordError: '', password: value });
                else
                    this.setState({ password: value });
                break;
            default:
                break;
        }
    }

    handleSubmit = async (event) => {
        try {
            event.preventDefault();
            const { username, email, fullname, password } = this.state;
            const fields = { username, email, fullname, password };
            const { barbak_backend_uri } = this.props;
            
            var emptyFields = Object.keys(fields).map(field => {
                if (fields[field].length)
                    return undefined;
                
                return { path: field, type: 'empty', message: 'Field is empty' };
            });
            emptyFields = emptyFields.filter((field) => field !== undefined);

            if (emptyFields.length) {
                const errorObj = new Error('Empty Fields');
                errorObj.errors = emptyFields;
                throw errorObj;
            }

            const { data } = axios.post(barbak_backend_uri + '/users/register', {
                username,
                email,
                fullname,
                password
            });
            console.log(data);

        } catch(err) {
            if (err.name === "AxiosError") {
                // const errorResponse = err.response;
                // if (errorResponse.status === 400) {
                //     const { data } = errorResponse;
                //     switch (data.path) {
                //         case 'user':
                //             this.setState({ emailError: data.message });
                //             break;
                //         case 'password':
                //             this.setState({ passwordError: data.message });
                //             break;
                //     }
                // } else if (errorResponse.status === 500) {
                //     this.setState({ otherError: 'An error occured while processing your request' });
                // }
            } else {
                const errors = err.errors;
                for (const error in errors) {
                    switch (errors[error].path) {
                        case 'username':
                            this.setState({ usernameError: errors[error].message });
                            break;
                        case 'email':
                            this.setState({ emailError: errors[error].message });
                            break;
                        case 'fullname':
                            this.setState({ fullnameError: errors[error].message });
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

    render() {
        const { 
            username, 
            usernameError, 
            email, 
            emailError, 
            fullname,
            fullnameError,
            password, 
            passwordError, 
            otherError 
        } = this.state;
        const { updateField, handleSubmit } = this;
        const images = [
            '/test/test-1.jpg',
            '/test/test-2.jpg',
            '/test/test-3.jpg',
            '/test/test-4.jpg',
            '/test/test-5.jpg',
            '/test/test-6.jpg',
            '/test/test-7.jpg',
            '/test/test-8.jpg',
            '/test/test-9.jpg',
            '/test/test-10.jpg',
        ]
        return <>
            <Head>
                <title>BarBak | Register</title>
            </Head>
            <StyledRegister>
                <SlideShow
                    images={images}
                />
                <div className='authentication'>
                    <RegistrationForm onSubmit={handleSubmit}>
                        <Logo/>
                        { otherError && <h1 className='otherError'>{otherError}</h1> }
                        <AuthInput
                            labelText={'Username'}
                            errorText={usernameError}
                            inputValue={username}
                            inputType={'text'}
                            inputCallback={(value) => updateField('username', value)}
                        />
                        <AuthInput
                            labelText={'Email'}
                            errorText={emailError}
                            inputValue={email}
                            inputType={'text'}
                            inputCallback={(value) => updateField('email', value)}
                        />
                        <AuthInput
                            labelText={'Full Name'}
                            errorText={fullnameError}
                            inputValue={fullname}
                            inputType={'text'}
                            inputCallback={(value) => updateField('fullname', value)}
                        />
                        <AuthInput
                            labelText={'Password'}
                            errorText={passwordError}
                            inputValue={password}
                            inputType={'password'}
                            inputCallback={(value) => updateField('password', value)}
                        />
                        <SubmitBtn value='Sign Up' />
                    </RegistrationForm>
                    <LoginContainer>
                        <h1>Have an account? <Link href='/login'>Log In</Link></h1>
                    </LoginContainer>
                </div>
            </StyledRegister>
        </>
    }
}

export default withOutAuth(Register, '/');
// export default withOutAuth(connect(mapStateToProps, mapDispatchToProps)(Login), '/');