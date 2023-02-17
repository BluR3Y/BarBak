import React, { useEffect, useState } from "react";

import { AuthenticationForm } from "@/styles/components/shared/authForm";
import { StyledSubmitBtn } from "@/styles/components/register/submitBtn";

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

    const handleSubmit = (event) => {
        event.preventDefault();
        
    }

    useEffect(() => {
        console.log(props)
    }, [])

    return <AuthenticationForm onSubmit={handleSubmit}>
        <Logo/>
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
        <StyledSubmitBtn value='next' />
    </AuthenticationForm>;
}

export default RegistrationOne;