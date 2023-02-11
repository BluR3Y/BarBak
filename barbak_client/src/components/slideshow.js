import React from "react";
import { StyledSlideShow, ImageItem } from "@/styles/components/slideshow";

export default class SlideShow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            images: this.props.images || [],
            activeImage: 0,
            imageCycle: null
        }
    }

    startCycle = () => {
        const imageCycle = setInterval(() => {
            this.nextImage();
        }, 7000);
        this.setState({ imageCycle });
    }

    nextImage = () => {
        this.setState(prevState => ({ activeImage: (prevState.activeImage + 1) % prevState.images.length }));
    }

    componentDidMount() {
        this.startCycle();
    }

    render() {
        const { images, activeImage } = this.state;
        return <StyledSlideShow>
            {images.map((image, index) => <ImageItem src={image} key={index} active={activeImage === index} />)}
        </StyledSlideShow>;
    }
}