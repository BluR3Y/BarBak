import styled from "styled-components";
import { StyledLogo } from "../components/logo";
import { StyledInput } from "../components/authInput";
import { hexToRgba } from "../utils/color_conversion";

export const StyledRegister = styled.div`
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

export const RegistrationForm = styled.form`
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

`;