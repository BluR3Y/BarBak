import styled from "styled-components";
import { StyledLogo } from "../components/logo";


export const StyledLogin = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: 100vh;

    .authentication {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: relative;
    }
`;

export const AuthenticationForm = styled.form`
    max-width: 370px;
    width: 80%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    padding: 30px 40px;
    border: 1px solid ${props => props.theme.secondary};
    background-color: ${props => props.theme.type === 'classic' ? '#fff' : '#2b2c36'};

    & ${StyledLogo} {
        font-size: 40px;
        margin: 0 0 25px 0;
    }

    input:focus,
    select:focus,
    textarea:focus,
    button:focus {
        outline: none;
    }
`;

export const AssistLink = styled.a`
    font-family: 'Poppins';
    font-weight: 500;
    font-size: 14px;
    text-decoration: none;
    align-self: flex-start;
    color: ${props => props.theme.accent};
`;

export const SubmitBtn = styled.button`
    width: inherit;
    padding: 6px 0;
    border-radius: 20px;
    background-color: ${props => props.theme.primary};
    border: none;
    font-family: 'Poppins';
    font-size: 18px;
    margin-top: 25px;
    cursor: pointer;
`;