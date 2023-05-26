import React, { useState } from "react";

import { AuthenticationForm } from "@/styles/components/shared/authForm";
import { StyledLogo } from "@/styles/components/shared/logo";
import AuthInput from "../shared/authInput";
import { StyledSubmitBtn } from "@/styles/components/register/submitBtn";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserInfo } from "@/redux/actions";

function RegistrationThree(props) {
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [otherError, setOtherError] = useState('');
    const dispatch = useDispatch();

    const handleSubmit = async (event) => {
        try {
            event.preventDefault();

            if (!username.length) 
                return setUsernameError('Username Field Is Empty')

            const { data } = await axios.post(`${props.barbak_backend_uri}/accounts/register/username`, {
                username
            }, { withCredentials: true });
            dispatch(setUserInfo(data))
            props.updateActiveRegistration('next');
        } catch(err) {
            if (err.name === "AxiosError") {
                console.log(err)
                const errorResponse = err.response;
                if (errorResponse.status === 400) {
                    const { data } = errorResponse;
                    switch (data.path) {
                        case 'username':
                            setUsernameError(data.message);
                            break;
                    }
                } else if (errorResponse.status === 401) {
                    setOtherError('You are not authorized to make this request')
                } else if (errorResponse.status === 500) {
                    setOtherError('An error occured while processing your request');
                }
            }
        }
    }

    return <AuthenticationForm onSubmit={handleSubmit} activeForm={props.activeForm}>
        <StyledLogo/>
        <AuthInput
            labelText={'Username'}
            errorText={usernameError}
            inputValue={username}
            inputType={'text'}
            inputCallback={(val) => setUsername(val)}
        />
            { otherError && <h1 className="otherError">{otherError}</h1> }
        <StyledSubmitBtn value='Sign Up' />
    </AuthenticationForm>;
}
export default RegistrationThree;