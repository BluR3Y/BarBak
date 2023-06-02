import Head from 'next/head';
import { MainContainer, StyledHome } from '@/styles/pages';

import Navigation from '@/components/navigation/navigation';
import HomeSection from '@/components/home/homeSection';

export default function Home(props) {

    return <>
        <Head>
            <title>BarBak | Home</title>
        </Head>
        <StyledHome>
            <Navigation/>
            <MainContainer>
                <HomeSection/>
                <HomeSection/>
                <HomeSection/>
            </MainContainer>
        </StyledHome>
    </>
}