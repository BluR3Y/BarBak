import React, { useRef, useState } from "react";

import { AuthenticationForm } from "@/styles/components/shared/authForm";
import { StyledLogo } from "@/styles/components/shared/logo";
import { StyledSubmitBtn } from "@/styles/components/register/submitBtn";
import { FormHeaders, CodeContainer, DigitInput, ResendLink, ErrorMessage } from "@/styles/components/register/registerTwo";
import axios from "axios";

function RegistrationTwo(props) {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);
    const [error, setError] = useState('');

    const { registrationInfo } = props;

    const handleInputChange = (event, index) => {
        const newDigits = [...digits];
        newDigits[index] = event.target.value;
    
        // Move focus to the next input field
        if (event.target.value !== '' && !isNaN(event.target.value) && index < 5) {
          inputRefs.current[index + 1].focus();
        }
    
        setDigits(newDigits);
    }

    const resendVerificationCode = async (event) => {
        try {
            event.preventDefault();
            // await axios.post(`${props.barbak_backend_uri}/accounts/register/resend`,);
            await axios({
                method: 'post',
                url: `${props.barbak_backend_uri}/accounts/register/resend`,
                withCredentials: true
            });
        } catch(err) {
            setError('An issue occured while processing your request');
        }
    }

    const handleSubmit = async (event) => {
        try {
            event.preventDefault();
            const code = digits.join('');

            // await axios.post(`${props.barbak_backend_uri}/accounts/register/verify`, {
            //     registration_code: code
            // }, {
            //     withCredentials: true
            // });
            await axios({
                method: 'post',
                url: `${props.barbak_backend_uri}/accounts/register/validate/${code}`,
                withCredentials: true
            });
            props.updateActiveRegistration('next');
        } catch(err) {
            console.log(err)
            if (err.name === "AxiosError") {
                const errorResponse = err.response;
                if (errorResponse.status === 400) {
                    const { data } = errorResponse;
                    switch (data.path) {
                        case 'code':
                            setError('Invalid Validation Code');
                            break;
                        default:
                            break;
                    }
                } else if (errorResponse.status === 500) {
                    setOtherError('An issue occured while processing your request');
                }
            } else {
                const errors = err.errors;
                for (const error in errors) {

                }
            }
        }
    }

    return <AuthenticationForm 
        activeForm={props.activeForm}
        onSubmit={handleSubmit}
    >
        <StyledLogo/>
            <FormHeaders>
                <h1>Check your inbox</h1>
                { registrationInfo && <h2>A verification code was sent to: <span>{registrationInfo.email}</span></h2> }

            </FormHeaders>
            <CodeContainer>
                { digits.map((digit, index) => (
                    <DigitInput
                        key={index}
                        value={digit}
                        onChange={(event) => handleInputChange(event, index)}
                        ref={(ref) => inputRefs.current[index] = ref}
                    />
                )) }
            </CodeContainer>
            <ResendLink onClick={resendVerificationCode}>Resend Code</ResendLink>
            {/* { error && <h1 className="otherError">{error}</h1> } */}
            { error && <ErrorMessage>{error}</ErrorMessage> }
        <StyledSubmitBtn value='Next' />
    </AuthenticationForm>;
}

export default RegistrationTwo;