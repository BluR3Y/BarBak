import { hexToRgba } from "@/utils/color_conversion";
import Link from "next/link";
import styled from "styled-components";

export const StyledGuestAuth = styled.div`
    height: 30px;
    width: 150px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

export const AuthButton = styled(Link)`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px 8px;
    background-color: transparent;
    border: 1px solid ${props => props.theme.primary};
    color: ${props => props.theme.primary};
    text-decoration: none;
    padding: 0 10px;

    font-family: 'Open Sans';
    font-weight: 600;
    font-size: 16px;

    &:hover {
        background-color: ${props => hexToRgba(props.theme.primary, 0.1)};
    }
`;