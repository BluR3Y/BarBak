import styled from "styled-components";
import { hexToRgba } from "@/utils/color_conversion";

export const FormHeaders = styled.div`
    width: 100%;
    margin-top: -5px;
    font-family: 'Poppins';
    font-size: 20px;

    h1 {
        font-size: 1.3em;
        font-weight: 600;
        color: ${props => props.theme.secondary};
    }
    h2 {
        font-size: 0.9em;
        font-weight: 400;
        color: ${props => props.theme.accent};
        
        span {
            font-size: 0.9em;
            font-weight: 500;
        }
    }
`;

export const CodeContainer = styled.div`
    display: flex;
    flex-direction: row;
    height: 50px;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0 0 0;
`;

export const DigitInput = styled.input.attrs(() => ({
    type: 'text',
    maxLength: '1'
}))`
    height: 80%;
    aspect-ratio: 1;
    border-radius: 5px;
    border: 2px solid ${props => props.isInvalid ? '#e82113' : 'transparent'};

    font-family: 'Open Sans';
    font-size: 20px;
    text-align: center;
`;

export const ResendLink = styled.a`
    align-self: flex-start;
    font-family: 'Poppins';
    cursor: pointer;
    color: ${props => props.theme.secondary};

    &:hover {
        text-decoration: underline;
    }
`;

export const ErrorMessage = styled.h1`
    font-family: 'Poppins';
    font-size: 17px;
    font-weight: 500;
    line-height: 18px;
    color: #e82113;
    text-align: center;
    margin-top: 15px;
`;