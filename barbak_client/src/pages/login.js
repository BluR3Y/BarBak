import Head from 'next/head';
import React from 'react';
import { StyledLogin, AuthenticationForm, InputField } from '../styles/login.module';

import SlideShow from '@/components/slideshow';

export default class Login extends React.Component {

    render() {
        const images = [
            '/images/cocktail-1.jpg',
            '/images/cocktail-2.jpg',
            '/images/cocktail-3.jpg',
            '/images/cocktail-4.jpg',
            '/images/cocktail-5.jpg',
            '/images/cocktail-6.jpg',
            '/images/cocktail-7.jpg',
        ];
        return (<>
            <Head>
                <title>BarBak | Login</title>
            </Head>
            <StyledLogin>
                <SlideShow
                    images={images}
                />
                <div className='authentication'>
                    <AuthenticationForm>
                        <InputField>
                            <label for='username'>Username</label>
                            <input type='text' id='username'/>
                        </InputField>
                    </AuthenticationForm>
                </div>
            </StyledLogin>
        </>)
    }
}