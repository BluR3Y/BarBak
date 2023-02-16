import styled, { css } from "styled-components";
import { StyledLogo } from "../components/logo";
import { StyledInput } from "../components/authInput";
import { hexToRgba } from "../utils/color_conversion";


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
        user-select: none;
    }
`;

export const AuthenticationForm = styled.form`
    max-width: 370px;
    width: 80%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    padding: 30px 40px;
    border: 1px solid ${props => hexToRgba(props.theme.accent, 0.5)};
    background-color: ${props => hexToRgba(props.theme.accent, 0.05)};

    & ${StyledLogo} {
        font-size: 40px;
        margin: 0 0 25px 0;
    }
    & ${StyledInput} {
        margin-bottom: 10px;
    }

    .otherError {
        font-size: 16px;
        font-family: 'Poppins';
        font-weight: 400;
        top: 100%;
        color: #e82113;
        line-height: 18px;
        margin-left: 8px;
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

export const SubmitBtn = styled.input.attrs(() => ({
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

export const RegisterContainer = styled.div`
    margin-top: 10px;
    margin-bottom: 50px;
    max-width: 370px;
    width: 80%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    padding: 20px 40px;
    border: 1px solid ${props => hexToRgba(props.theme.accent, 0.5)};
    background-color: ${props => hexToRgba(props.theme.accent, 0.05)};

    h1 {
        font-family: 'Open Sans';
        font-size: 14px;
        font-weight: 400;
        color: ${props => props.theme.accent};
        a {
            text-decoration: none;
            font-weight: 500;
            color: ${props => props.theme.primary};
        }
    }
`;