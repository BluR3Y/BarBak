import React from "react";
import Link from "next/link";

import { SectionContainer, SectionHeader, StyledHomeSection } from "@/styles/components/home/homeSection";
import DrinkCard from "./drinkCard";

import AngleLeft from "public/icons/angle-left";
import AngleRight from "public/icons/angle-right";

class HomeSection extends React.Component {
    constructor(props) {
        super(props);
    }

    CarouselButtonGroup = ({ next, previous, goTo, ...rest }) => {
        const { carouselState: { currentSlide } } = rest;
        return  <SectionHeader>
            <h1>Popular near you</h1>
            <Link href='/'>See All</Link>
            <div className="sectionNavigation">
                <button onClick={() => previous()}><AngleLeft/></button>
                <button onClick={() => next()}><AngleRight/></button>
            </div>
        </SectionHeader>
    }

    render() {
        const {CarouselButtonGroup} = this;
        return <StyledHomeSection>
            <SectionContainer
                customButtonGroup={<CarouselButtonGroup/>}>
                <DrinkCard/>
                <DrinkCard/>
                <DrinkCard/>
                <DrinkCard/>
                <DrinkCard/>
            </SectionContainer>
        </StyledHomeSection>
    }
}

export default HomeSection;