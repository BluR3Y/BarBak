import Head from 'next/head';
import { useSelector } from 'react-redux';
import { MainContainer, StyledHome } from '@/styles/pages';

import Navigation from '@/components/navigation/navigation';
import DrinkSection from '@/components/home/drinkSection';

export default function Home() {
    const { userInfo } = useSelector((state) => state.userReducer);
    const userSections = [
        { sectionTitle: "Your Drinks", sectionSearch: "@me" }
    ]

    return <>
        <Head>
            <title>BarBak | Home</title>
        </Head>
        <StyledHome>
            <Navigation/>
            <MainContainer>
                { !!userInfo && userSections.map(({ sectionTitle, sectionSearch }, index) => (
                    <DrinkSection key={index} sectionTitle={sectionTitle} drinkSearch={sectionSearch} />
                )) }
            </MainContainer>
        </StyledHome>
    </>
}