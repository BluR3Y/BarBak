import { hexToRgba } from "@/utils/color_conversion";
import Link from "next/link";
import styled, { css } from "styled-components";

export const StyledHomeItem = styled.div`
    height: inherit;
    aspect-ratio: 0.85;
    border-radius: 10px;
    overflow: hidden;
    font-size: 0.8em;
    flex-shrink: 0;
    ${props => css`
        background-color: ${props.theme.container};
        border: 1px solid ${hexToRgba(props.theme.accent, 0.2)};
        &:hover {
            border: 1px solid ${hexToRgba(props.theme.accent, 0.5)};
        }
    `}

    .itemInfo {
        height: inherit;
        padding: 8px 6px;
        font-family: 'Poppins';
        cursor: pointer;

        h1 {
            font-weight: 400;
            font-size: 1em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 4px
        }
        h2 {
            font-weight: 300;
            font-size: 0.9em;
            color: ${props => props.theme.accent};
            line-height: 1.35em;
            display: -webkit-box;
            -webkit-line-clamp: 5;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    }
`;

export const CoverContainer = styled(Link)`
    width: inherit;
    aspect-ratio: 1.5;
    overflow: hidden;
    display: flex;

    background-image: url(${props => props.imgSrc});
    background-size: cover;
    background-position: center;
    background-color: #fff;
`;