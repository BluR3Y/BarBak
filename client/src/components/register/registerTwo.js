import React, { useEffect, useRef, useState } from "react";

import { AuthenticationForm } from "@/styles/components/shared/authForm";
import { StyledLogo } from "@/styles/components/shared/logo";
import { StyledSubmitBtn } from "@/styles/components/register/submitBtn";
import { FormHeaders, CodeContainer, DigitInput, ResendLink, ErrorMessage } from "@/styles/components/register/registerTwo";
import axios from "axios";

function RegistrationTwo(props) {
    const numDigits = 6;
    const [digits, setDigits] = useState(Array(numDigits).fill(''));
    const inputRefs = useRef([]);
    const [invalidDigits, setInvalidDigits] = useState(new Set());
    const [error, setError] = useState('');
    const { registrationInfo } = props;

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

    const handleInputChange = (event, index) => {
        if (!/^\d*$/.test(event.target.value)) {
            return;
        }
        if (invalidDigits.size) {
            setInvalidDigits(new Set());
        }

        const newDigits = [...digits];
        newDigits[index] = event.target.value;
        setDigits(newDigits);
    
        // Move focus to the next input field
        if (event.target.value !== '' && index < numDigits - 1) {
          inputRefs.current[index + 1].focus();
        }
    }

    const handleKeyDown = (event, index) => {
        if (event.key === 'Backspace' && index > 0 && digits[index] === '') {
            // Move focus to the previous input field
            inputRefs.current[index - 1].focus();
        }
    }

    const handlePaste = (event) => {
        event.preventDefault();
        const pastedData = event.clipboardData.getData('text/plain').slice(0, numDigits);
        const newDigits = [...digits];
        for (let i = 0; i < numDigits; i++) {
            newDigits[i] = /^\d*$/.test(pastedData[i]) ? pastedData[i] : '';
        }
        setDigits(newDigits);
    }

    const handleFocus = (index) => {
        inputRefs.current[index].select();
    }

    const resendVerificationCode = async (event) => {
        try {
            event.preventDefault();
            await axios({
                method: 'post',
                url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/accounts/register/resend`,
                withCredentials: true
            });
        } catch(err) {
            setError('An issue occured while processing your request');
        }
    }

    const handleSubmit = async (event) => {
        try {
            event.preventDefault();
            let code = '';
            const invalidFields = new Set();
            for (let i = 0; i < numDigits; i++) {
                if (!/^\d+$/.test(digits[i])) {
                    invalidFields.add(i);
                    continue;
                }
                code += digits[i];
            }
            if (invalidFields.size) {
                setInvalidDigits(invalidFields);
                return setError('Invalid verification code');
            }

            await axios({
                method: 'post',
                url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/accounts/register/validate/${code}`,
                withCredentials: true
            });
            props.updateActiveRegistration('next');
        } catch(err) {
            if (err.name === "AxiosError") {
                const { status } = err.response;
                switch (status) {
                    case 400:
                        setError('Invalid verification Code');
                        break;
                    default:
                        setError('An issue occured while processing your request');
                        break;
                }
            }
        }
    }

    return <AuthenticationForm onSubmit={handleSubmit}>
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
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        onFocus={() => handleFocus(index)}
                        onPaste={handlePaste}
                        ref={(ref) => inputRefs.current[index] = ref}
                        isInvalid={invalidDigits.has(index)}
                    />
                )) }
            </CodeContainer>
            <ResendLink onClick={resendVerificationCode}>Resend Code</ResendLink>
            { error && <ErrorMessage>{error}</ErrorMessage> }
        <StyledSubmitBtn value='Next' />
    </AuthenticationForm>;
}

export default RegistrationTwo;