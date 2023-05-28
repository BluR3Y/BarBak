import React, { useEffect, useState } from "react";

import { AuthenticationForm } from "@/styles/components/shared/authForm";
import { StyledLogo } from "@/styles/components/shared/logo";
import AuthInput from "../shared/authInput";
import { StyledSubmitBtn } from "@/styles/components/register/submitBtn";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserInfo } from "@/redux/actions";
import { registerThirdValidator } from "@/lib/validations/user-validations";

function RegistrationThree(props) {
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [otherError, setOtherError] = useState('');
    const dispatch = useDispatch();

    useEffect(() => {
        // Warn user of progress loss if page is left
        const handleBeforeUpload = (event) => {
            event.preventDefault();
            // Required for Chrome compatibility
            event.returnValue = '';
        }
        window.addEventListener('beforeunload', handleBeforeUpload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUpload);
        }
    }, []);

    const usernameCallback = (username) => {
        if (usernameError.length) {
            setUsernameError('');
        }
        setUsername(username);
    }

    const handleSubmit = async (event) => {
        try {
            event.preventDefault();
            const { error } = registerThirdValidator.validate(username);
            if (error) throw error;

            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URI}/accounts/register/username`, {
                username
            }, { withCredentials: true });
            dispatch(setUserInfo(data))
            props.updateActiveRegistration('next');
        } catch(err) {
            if (err.name === 'AxiosError') {
                const { status, data: { errors } } = err.response;
                switch (status) {
                    case 400:
                        setUsernameError(errors.username.message)
                        break;
                    default:
                        setOtherError(data.message);
                        break;
                }
            }
            if (err.name === 'ValidationError') {
                const { details: [info] } = err;
                setUsernameError(info.message);
            }
        }
    }

    return <AuthenticationForm onSubmit={handleSubmit}>
        <StyledLogo/>
        <AuthInput
            labelText={'Username'}
            errorText={usernameError}
            inputValue={username}
            inputType={'text'}
            inputCallback={usernameCallback}
        />
            { otherError && <h1 className="otherError">{otherError}</h1> }
        <StyledSubmitBtn value='Sign Up' />
    </AuthenticationForm>;
}
export default RegistrationThree;