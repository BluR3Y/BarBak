import Head from 'next/head';
import React from 'react';
import { StyledLogin } from '../styles/login.module';

import SlideShow from '@/components/slideshow';

export default class Login extends React.Component {


    render() {
        return (<>
            <Head>
                <title>BarBak | Login</title>
            </Head>
            <StyledLogin>
                <SlideShow/>
                <form className='loginForm'>
                    <h1>Login</h1>
                </form>
            </StyledLogin>
        </>)
    }
}