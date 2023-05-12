import styled from "styled-components";
import { hexToRgba } from "@/utils/style/color_conversion";

export const RedirectContainer = styled.div`
    margin-top: 10px;
    margin-bottom: 50px;
    max-width: 400px;
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