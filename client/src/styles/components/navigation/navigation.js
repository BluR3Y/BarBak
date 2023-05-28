import styled from "styled-components";
import { StyledLogo } from "../shared/logo";

export const StyledNavigation = styled.div`
    height: 50px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 6px 20px;
    /* justify-content: center; */
    background-color: ${props => props.theme.container};
    box-shadow: 0 1px 0px ${props => props.theme.type === 'classic' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)'};
`;

export const NavLogo = styled(StyledLogo)`
    font-size: 28px;
    font-family: 'Poppins';
`;

export const NavContent = styled.div`
    height: 100%;
    margin-left: auto;
    display: flex;
    flex-direction: row;
    align-items: center;
`;