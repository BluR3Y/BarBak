import React from "react";
import Link from "next/link";

import { SectionContainer, SectionHeader, StyledHomeSection } from "@/styles/components/home/homeSection";
import HomeItem from "./homeItem";

import AngleLeft from "public/icons/angle-left";
import AngleRight from "public/icons/angle-right";

class HomeSection extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <StyledHomeSection>
            <SectionHeader>
                <h1>Popular near you</h1>
                <Link href='/'>See All</Link>
                <div className="sectionNavigation">
                    <button><AngleLeft/></button>
                    <button><AngleRight/></button>
                </div>
            </SectionHeader>
            <SectionContainer>
                <HomeItem/>
            </SectionContainer>
        </StyledHomeSection>
    }
}

export default HomeSection;