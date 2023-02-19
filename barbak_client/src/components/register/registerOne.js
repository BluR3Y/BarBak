import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";


import { AuthenticationForm } from "@/styles/components/shared/authForm";
import { StyledSubmitBtn } from "@/styles/components/register/submitBtn";
import { RedirectContainer } from "@/styles/components/shared/authRedirect";

import Logo from "../shared/logo";
import AuthInput from "../shared/authInput";

function RegistrationOne(props) {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [fullname, setFullName] = useState('');
    const [fullnameError, setFullNameError] = useState('');
    const [otherError, setOtherError] = useState('');

    const handleSubmit = async (event) => {
        try {
            event.preventDefault();
            if (!email.length || !password.length) {
                const errorObj = new Error('Empty Fields');
                errorObj.errors = [];
                if (!email.length)
                    errorObj.errors.push({ path: 'email', type: 'valid', message: 'Email field is empty' });
                if (!password.length)
                    errorObj.errors.push({ path: 'password', type: 'valid', message: 'Password field is empty'});
                throw errorObj;
            }

            await axios.post(`http://localhost:3000/users/register`, {
                fullname,
                email,
                password
            }, {
                withCredentials: true
            });
            props.updateRegistrationInfo({ fullname, email, password });
            props.updateActiveRegistration('next');
        } catch(err) {
            if (err.name === "AxiosError") {
                const errorResponse = err.response;
                console.log(errorResponse)
                if (errorResponse.status === 400) {
                    const { data } = errorResponse;
                    switch (data.path) {
                        case 'email':
                            setEmailError(data.message);
                            break;
                        default:
                            break;
                    }
                } else if (errorResponse.status === 500) {
                    setOtherError('An error occured while processing your request');
                }
            } else {
                const errors = err.errors;
                for (const error in errors) {
                    switch (errors[error].path) {
                        case 'email':
                            setEmailError(errors[error].message);
                            break;
                        case 'password':
                            setPasswordError(errors[error].message);
                            break;
                        case 'fullname':
                            setFullNameError(errors[error].message);
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    return <>
        <AuthenticationForm onSubmit={handleSubmit} activeForm={props.activeForm}>
            <Logo/>
            { otherError && <h1 className='otherError'>{otherError}</h1> }
            <AuthInput
                labelText={'Full Name'}
                errorText={fullnameError}
                inputValue={fullname}
                inputType={'text'}
                inputCallback={(val) => setFullName(val)}
            />
            <AuthInput
                labelText={'Email'}
                errorText={emailError}
                inputValue={email}
                inputType={'text'}
                inputCallback={(val) => setEmail(val)}
            />
            <AuthInput
                labelText={'Password'}
                errorText={passwordError}
                inputValue={password}
                inputType={'password'}
                inputCallback={(val) => setPassword(val)}
            />
            <StyledSubmitBtn value='Next' />
        </AuthenticationForm>
        <RedirectContainer>
            <h1>Already Registered? <Link href='/login'>Log In</Link></h1>
        </RedirectContainer>
    </>;
}

export default RegistrationOne;