import { hexToRgba } from "@/utils/color_conversion";
import Link from "next/link";
import styled, { css } from "styled-components";

export const StyledDrinkCard = styled.div`
    height: 100%;
    width: 95%;
    overflow: hidden;
    font-size: 0.85em;
    flex-shrink: 0;
    border-radius: 4px;
    display: flex;
    flex-direction: column;

    .drinkInfo {
        font-family: 'Poppins';
        cursor: pointer;
        padding: 4px 6px;

        .drinkRating {
            display: flex;
            flex-direction: row;
            align-items: flex-end;
            font-size: 0.75em;
            
            .ratingValue {
                display: flex;
                h1 {
                    font-size: 1.2em;
                    line-height: 1.1em;
                    color: ${props => props.theme.accent};
                    margin: 0 0.2em 0 0;
                }
                svg {
                    fill: gold;
                    font-size: 1em;
                    align-self: center;
                    margin-bottom: 0.2em;
                }
            }
            h1 {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                font-family: 'Montserrat';
                font-weight: 400;
                color: ${props => hexToRgba(props.theme.accent, 0.6)};
                margin-left: 10px;
                font-size: 1.1em;
            }
        }

        h1 {
            font-weight: 400;
            font-size: 1em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        h2 {
            font-weight: 300;
            font-size: 0.8em;
            color: ${props => props.theme.accent};
            line-height: 1.35em;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-top: 7px;
        }
    }
    ${props => css`
        background-color: ${props.theme.container};
        border: 1px solid ${hexToRgba(props.theme.accent, 0.15)};

        &:hover {
            border: 1px solid ${hexToRgba(props.theme.accent, 0.3)};
        }
    `}
`;

export const CoverContainer = styled(Link)`
    overflow: hidden;
    flex-basis: 100%;
    
    background-image: url(${props => props.imgSrc});
    background-size: cover;
    background-position: center;
    background-color: #fff;
`;