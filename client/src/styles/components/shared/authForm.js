import styled, { css } from "styled-components";
import { StyledLogo } from "./logo";
import { StyledInput } from "./authInput";
import { hexToRgba } from "@/utils/color_conversion";

export const AuthenticationForm = styled.form`
    max-width: 400px;
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