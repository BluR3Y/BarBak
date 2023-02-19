import styled from "styled-components";

export const StyledSubmitBtn = styled.input.attrs(() => ({
    type: 'submit'
}))`
    font-family: 'Poppins';
    font-size: 18px;
    cursor: pointer;
    border: none;
    color: ${props => props.theme.background};
    background-color: ${props => props.theme.primary};
    border-radius: 6px;
    padding: 5px 0;
    width: 100%;
    margin: 35px 0 0 0;
`;