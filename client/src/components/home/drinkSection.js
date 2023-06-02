import React from "react";
import Link from "next/link";
import axios from "axios";

import { SectionContainer, SectionHeader, StyledDrinkSection } from "@/styles/components/home/drinkSection";
import DrinkCard from "./drinkCard";

import AngleLeft from "public/icons/angle-left";
import AngleRight from "public/icons/angle-right";

class DrinkSection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            page: 1,
            drinks: null
        }
    }

    async componentDidMount() {
        try {
            const { data: { data } } = await axios({
                method: 'get',
                url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/drinks/${this.props.drinkSearch}?page=${this.state.page}`,
                withCredentials: true
            });
            this.setState({ drinks: data, isLoading: false });
        } catch(err) {
            console.log('An error occured while fetching drinks');
        }
    }

    CarouselButtonGroup = ({ next, previous, goTo, ...rest }) => {
        const { carouselState: { currentSlide } } = rest;
        const { sectionTitle } = this.props;
        return  <SectionHeader>
            <h1>{sectionTitle}</h1>
            <Link href='/'>See All</Link>
            <div className="sectionNavigation">
                <button onClick={() => previous()}><AngleLeft/></button>
                <button onClick={() => next()}><AngleRight/></button>
            </div>
        </SectionHeader>
    }

    render() {
        const {CarouselButtonGroup} = this;
        const { isLoading, drinks } = this.state;
        if (isLoading) {
            return <h1>Loading</h1>
        }
        return <StyledDrinkSection>
            <SectionContainer customButtonGroup={<CarouselButtonGroup/>}>
                { !isLoading && drinks.map((info, index) => (
                    <DrinkCard key={index} {...info} />
                )) }
            </SectionContainer>
        </StyledDrinkSection>
    }
}

export default DrinkSection;