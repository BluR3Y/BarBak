import styled from "styled-components";
import { StyledLogo } from "../shared/logo";

export const StyledNavigation = styled.div`
    height: 45px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
    background-color: #fff;
    box-shadow: 0 1px 0px rgba(0,0,0,0.2);
    /* box-shadow: h-shadow v-shadow blur spread color */
    display: flex;
    flex-direction: row;
    align-items: center;
    /* justify-content: center; */
`;

export const NavLogo = styled(StyledLogo)`
    font-size: 28px;
    margin-left: 15px;
    font-family: 'Poppins';
`;