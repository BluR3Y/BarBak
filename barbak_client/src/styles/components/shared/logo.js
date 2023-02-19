import styled from "styled-components";

export const StyledLogo = styled.a.attrs(() => ({
    href: '/',
    children: 'barbak'
}))`
    /* font-size: 40px; */
    line-height: 1.1em;
    text-decoration: none;
    font-family: 'Poppins';
    font-weight: 600;
    color: #ff5744;
    border-radius: 8px;
    user-select: none;
`;