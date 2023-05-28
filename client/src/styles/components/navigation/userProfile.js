import { hexToRgba } from "@/utils/color_conversion";
import Link from "next/link";
import styled, { css } from "styled-components";

export const StyledUserProfile = styled.div`
    height: inherit;
    aspect-ratio: 1;
    position: relative;
    display: flex;
    user-select: none;
`;

export const UserMenuButton = styled.button.attrs((props) => ({
    children: <img src={props.imgSrc} />
}))`
    flex-grow: 1;
    aspect-ratio: 1;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    cursor: pointer;

    img {
        width: 85%;
        height: auto;
        border-radius: 50%;
    }
`;

export const UserMenu = styled.div`
    width: 280px;
    height: auto;
    position: absolute;
    right: 0;
    top: calc(100% + 5px);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    padding: 6px 6px;
    font-size: 15px;

    ${props => css`
        background-color: ${props.theme.container};
        border: 1px solid ${hexToRgba(props.theme.accent, 0.5)};
    `}

    .profileLink {
        text-decoration: none;
        flex-grow: 1;
        padding: 2px 6px;
        border: 1px solid ${props => props.theme.primary};
        border-radius: 12px 12px;
        margin-bottom: 10px;
        
        font-family: 'Montserrat';
        font-weight: 500;
        font-size: 1em;
        text-align: center;
        color: ${props => props.theme.primary};
    }
`;

export const UserInfoContainer = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    padding: 2px 0;
    margin-bottom: 10px;

    img {
        border-radius: 50%;
        height: 50px;
        width: auto;
    }

    .userInfo {
        flex-grow: 1;
        margin: 0 5px;
        font-size: 1em;
        overflow: hidden;

        h1,
        h2 {
            font-family: 'Poppins';
            color: ${props => props.theme.accent};
        }
        h1 {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: 500;
            font-size: 1em;
            margin-bottom: 2px;
        }
        h2 {
            font-weight: 400;
            font-size: 0.9em;
            line-height: 1.3em;
        }
    }
`;

export const MenuSection = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 5px;
    padding: 3px 0 2px 0;

    .sectionLabel {
        font-family: 'Poppins';
        font-weight: 500;
        font-size: 1.1em;
        color: ${props => props.theme.accent};
    }

    border-bottom: 1px solid ${props => hexToRgba(props.theme.accent, 0.5)};
`;

export const SectionItem = styled(Link)`
    font-family: 'Poppins'; 
    font-weight: 300;
    font-size: 0.92em;
    color: ${props => hexToRgba(props.theme.accent, 0.65)};
    cursor: pointer;
    padding: 2px 0;
    text-decoration: none;
`;