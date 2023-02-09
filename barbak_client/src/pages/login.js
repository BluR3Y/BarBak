import Head from 'next/head';
import React from 'react';
import { StyledLogin, AuthenticationForm } from '@/styles/pages/login';

import SlideShow from '@/components/slideshow';
import AuthInput from '@/components/authInput';

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
                        <AuthInput
                            labelText={'Email or Username'}
                        />
                        {/* <InputField>
                            <label for='username'>Username</label>
                            <input type='text' id='username'/>
                        </InputField>
                        <InputField>
                            <label for='password'>Password</label>
                            <input type='text' id='password'/>
                        </InputField> */}
                        
                    </AuthenticationForm>
                </div>
            </StyledLogin>
        </>)
    }
}