import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

import { AuthenticationForm } from "@/styles/components/shared/authForm";
import { StyledSubmitBtn } from "@/styles/components/register/submitBtn";
import { RedirectContainer } from "@/styles/components/shared/authRedirect";

import { StyledLogo } from "@/styles/components/shared/logo";
import AuthInput from "../shared/authInput";
import { registerFirstValidator } from '@/lib/validations/user-validations';

function RegistrationOne(props) {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [fullname, setFullName] = useState('');
    const [fullnameError, setFullNameError] = useState('');
    const [otherError, setOtherError] = useState('');

    const fullnameCallback = (fullname) => {
        if (fullnameError)
            setFullNameError('');
        setFullName(fullname);
    }

    const emailCallback = (email) => {
        if (emailError)
            setEmailError('');
        setEmail(email);
    }

    const passwordCallback = (password) => {
        if (passwordError)
            setPasswordError('');
        setPassword(password);
    }

    const handleSubmit = async (event) => {
        try {
            event.preventDefault();
            const { error } = registerFirstValidator.validate({ fullname, email, password }, { abortEarly: false, allowUnknown: false });
            if (error) throw error;

            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/accounts/register`, {
                fullname,
                email,
                password
            }, {
                withCredentials: true
            });
            props.updateRegistrationInfo({ fullname, email, password });
            props.updateActiveRegistration('next');
        } catch(err) {
            // Resolving error relating to http request
            if (err.name === "AxiosError") {
                const { data, status } = err.response;
                switch (status) {
                    case 409:
                        setEmailError(data.message);
                        break;
                    default:
                        setOtherError(data.message);
                        break;
                }
            }
            // Resolving error relating to field validation
            if (err.name === "ValidationError") {
                const { details } = err;
                for (const { message, path, type } of details) {
                    console.log(type)
                    switch (path[0]) {
                        case 'fullname':
                            setFullNameError(fullnameError.length ? fullnameError : message);
                            break;
                        case 'email':
                            setEmailError(emailError.length ? emailError : message);
                            break;
                        case 'password':
                            setPasswordError(passwordError.length ? passwordError : message);
                        default:
                            break;
                    }
                }
            }
        }
    }

    return <>
        <AuthenticationForm onSubmit={handleSubmit}>
            <StyledLogo/>
            { otherError && <h1 className='otherError'>{otherError}</h1> }
            <AuthInput
                labelText={'Full Name'}
                errorText={fullnameError}
                inputValue={fullname}
                inputType={'text'}
                inputCallback={fullnameCallback}
            />
            <AuthInput
                labelText={'Email'}
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
            <StyledSubmitBtn value='Next' />
        </AuthenticationForm>
        <RedirectContainer>
            <h1>Already Registered? <Link href='/login'>Log In</Link></h1>
        </RedirectContainer>
    </>;
}

export default RegistrationOne;