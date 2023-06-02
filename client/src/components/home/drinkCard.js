import { CoverContainer, StyledDrinkCard } from "@/styles/components/home/drinkCard";
import Router from "next/router";
import Star from "public/icons/star";
import React from "react";

class DrinkCard extends React.Component {
    constructor(props) {
        super(props);
        // Dummy Data
        this.state = {
            drinkId: 123,
            drinkName: "Moscow Mule Cocktail",
            drinkCover: "https://cocktailsdistilled.com/wp-content/uploads/2018/06/Dirty-martini-565x565.jpg",
            drinkRating: 3.8,
            numRatings: 189,
            drinkDescription: "A Moscow mule is a cocktail made with vodka, ginger beer and lime juice, garnished with a slice or wedge of lime and a sprig of mint. The drink is a type of buck and is sometimes called a vodka buck. The Moscow mule is popularly served in a copper mug, which takes on the cold temperature of the liquid.",
            drinkUrl: `/drinks?drinkId=${11}`
        }
    }

    render() {
        const { id, name, cover, description } = this.props;
        const drinkPage = `/drinks?drinkId=${id}`;
        const {drinkRating, numRatings} = this.state;
        return <StyledDrinkCard onClick={() => Router.push(drinkPage)}>
            <CoverContainer 
                href={drinkPage}
                src={cover}
            />
            <div className="drinkInfo">
                <h1>{name}</h1>
                <div className="drinkRating">
                    <div className="ratingValue">
                        <h1>{drinkRating}</h1>
                        <Star/>
                    </div>
                    <h1>{`${numRatings} ratings`}</h1>
                </div>
                <h2>{description}</h2>
            </div>
        </StyledDrinkCard>
    }
}

export default DrinkCard;