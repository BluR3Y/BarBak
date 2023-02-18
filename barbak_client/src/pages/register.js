import Head from 'next/head';
import React from "react";

import { withOutAuth } from "@/components/hocs/authWrapper";
import { StyledRegister } from '@/styles/pages/register';

import SlideShow from '@/components/shared/slideshow';

import RegistrationOne from '@/components/register/registerOne';
import RegistrationTwo from '@/components/register/registerTwo';

const registrationSteps = [RegistrationOne, RegistrationTwo]

class Register extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            registrationStep: 0,
            registrationInfo: {}
        }
    }

    updateActiveRegistration = (direction) => {
        if (direction === 'next')
            this.setState(prevState => ({ registrationStep: prevState.registrationStep + 1 }));
        else if (direction === 'prev')
            this.setState(prevState => ({ registrationStep: prevState.registrationStep - 1 }));
    }

    updateRegistrationInfo = (info) => {
        this.setState(prevState => ({ registrationInfo: {
            ...prevState.registrationInfo,
            ...info
        } }));
    }

    render() {
        const { registrationStep, registrationInfo } = this.state;
        const { updateRegistrationInfo, updateActiveRegistration } = this;
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
            <Head>BarBak | Register</Head>
            <StyledRegister>
                <SlideShow
                    images={images}
                />
                <div className='authentication'>
                    { registrationSteps.map((Component, index) => (
                        <Component 
                            key={index} 
                            activeForm={registrationStep === index}
                            updateActiveRegistration={updateActiveRegistration}
                            updateRegistrationInfo={updateRegistrationInfo}
                            registrationInfo={registrationInfo}
                        />
                    ))}
                </div>
            </StyledRegister>
        </>
    }
}

export default withOutAuth(Register, '/');