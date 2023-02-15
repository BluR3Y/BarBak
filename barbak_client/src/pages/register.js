import Head from 'next/head';
import React from "react";
import Router from 'next/router';

import { withOutAuth } from "@/hocs/authWrapper";
import { RegistrationForm, StyledRegister } from "@/styles/pages/register";

import Logo from '@/components/logo';
import SlideShow from '@/components/slideshow';


// import Head from 'next/head';
// import React from 'react';
// import { StyledLogin, AuthenticationForm, SubmitBtn, AssistLink, RegisterContainer } from '@/styles/pages/login';
// import Router from 'next/router';
// import Logo from '@/components/logo';

// import SlideShow from '@/components/slideshow';
// import AuthInput from '@/components/authInput';
// import { withOutAuth } from '@/hocs/authWrapper';

// import { connect } from 'react-redux';
// import { setUserInfo } from '@/redux/actions';
// import axios from 'axios';
// import Link from 'next/link';

class Register extends React.Component {

    render() {
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
                    <RegistrationForm>
                        
                    </RegistrationForm>
                </div>
            </StyledRegister>
        </>
    }
}

export default withOutAuth(Register, '/');
// export default withOutAuth(connect(mapStateToProps, mapDispatchToProps)(Login), '/');