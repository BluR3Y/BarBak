import React from "react";
import styled from "styled-components";

const StyledTesting = styled.div`
    height: 100vh;
    display: flex;
    flex-direction: column;
    div {
        flex: 1 1 auto;
    }
    div:nth-child(1) {
        background-color: ${props => props.theme.primary};
    }
    div:nth-child(2) {
        background-color: ${props => props.theme.secondary};
    }
    div:nth-child(3) {
        background-color: ${props => props.theme.accent};
    }
    div:nth-child(4) {
        background-color: ${props => props.theme.background};
    }
`;

export default class Testing extends React.Component {
    render() {
        return <StyledTesting>
            <div/>
            <div/>
            <div/>
            <div/>
        </StyledTesting>;
    }
}