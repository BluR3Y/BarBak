import Head from 'next/head';
import { StyledHome } from '@/styles/pages';

import Navigation from '@/components/navigation/navigation';

export default function Home() {

    return <>
        <Head>
            <title>BarBak | Home</title>
        </Head>
        <StyledHome>
            <Navigation/>
            <div style={{ height:'20px', backgroundColor:'transparent' }}/>
            <div style={{ height:'100vh', backgroundColor:'transparent' }}/>
        </StyledHome>
    </>
}