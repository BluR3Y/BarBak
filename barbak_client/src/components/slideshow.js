import React from "react";
import { StyledSlideShow, ImageItem } from "@/styles/slideshow.component";

export default class SlideShow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            images: [
                'https://images.unsplash.com/photo-1609951651556-5334e2706168?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
                'https://images.unsplash.com/photo-1550426735-c33c7ce414ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=671&q=80',
                'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
                'https://images.unsplash.com/photo-1592858167090-2473780d894d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
                'https://images.unsplash.com/photo-1592858321831-dabeabc2dd65?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
                'https://images.unsplash.com/photo-1618799805265-4f27cb61ede9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=735&q=80',
                'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80'
            ],
            currentImage: 0,
        }
    }

    render() {
        const { images, currentImage } = this.state;
        return <StyledSlideShow>
            <ImageItem
                src={images[currentImage]}
            />
        </StyledSlideShow>;
    }
}