import styled, { css } from "styled-components";

export const StyledSlideShow = styled.div`
    position: relative;
    overflow: hidden;
    flex: 1 1 auto;

    @media screen and (max-width: 650px) {
        display: none;
    }
`;

export const ImageItem = styled.img.attrs(_ => ({
    draggable: false
}))`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    display: none;
    height: 100%;
    width: 100%;
    object-fit: cover;

    ${props => props.active && `
        display: block;
        animation-name: fadeIn;
        animation-duration: 1.3s;
    `}    

    @media screen and (max-width: 1350px) {
        width: 700px;
    }

    @keyframes fadeIn {
        from {
            opacity: 0.4;
        }to{
            opacity: 1;
        }
    }
`;