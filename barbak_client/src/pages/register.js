import Head from 'next/head';
import React from "react";
import Router from 'next/router';
import Link from 'next/link';
import axios from 'axios';

import { withOutAuth } from "@/hocs/authWrapper";
import { StyledRegister } from '@/styles/pages/register';

// import Logo from '@/components/shared/logo';
import SlideShow from '@/components/shared/slideshow';
import AuthInput from '@/components/shared/authInput';

// import { connect } from 'react-redux';
// import { setUserInfo } from '@/redux/actions';

import RegistrationOne from '@/components/register/registerOne';
import RegistrationTwo from '@/components/register/registerTwo';

class Register extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            registrationStep: 0
        }
    }

    activeRegistration = () => {
        const { registrationStep } = this.state;

        if (registrationStep === 0)
            return RegistrationOne;
        else if (registrationStep === 1)
            return RegistrationTwo;
    }

    updateActiveRegistration = (val) => {
        this.setState({ registrationStep: val });
    }

    render() {
        const { activeRegistration, updateActiveRegistration } = this;
        const ActiveComponent = activeRegistration(); 
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
                    <ActiveComponent updateActiveRegistration={updateActiveRegistration} />
                </div>
            </StyledRegister>
        </>
    }
}

export default withOutAuth(Register, '/');