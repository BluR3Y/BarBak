import { CoverContainer, StyledHomeItem } from "@/styles/components/home/homeItem";
import React from "react";

class HomeItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <StyledHomeItem>
            <CoverContainer 
                href="https://reyhector.com"
                imgSrc="https://bakeitwithlove.com/wp-content/uploads/2022/07/Moscow-Mule-sq.jpg"
            />
            <div className="itemInfo">
                <h1>Moscow Mule</h1>
                <h2>A Moscow mule is a cocktail made with vodka, ginger beer and lime juice, garnished with a slice or wedge of lime and a sprig of mint. The drink is a type of buck and is sometimes called a vodka buck. The Moscow mule is popularly served in a copper mug, which takes on the cold temperature of the liquid. </h2>
            </div>
        </StyledHomeItem>
    }
}

export default HomeItem;