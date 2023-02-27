import styled, { css } from "styled-components";
import { hexToRgba } from "@/utils/style/color_conversion";


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

export const AssistLink = styled.a`
    font-family: 'Poppins';
    font-weight: 500;
    font-size: 14px;
    text-decoration: none;
    align-self: flex-start;
    color: ${props => props.theme.accent};
`;

// export const RegisterContainer = styled.div`
//     margin-top: 10px;
//     margin-bottom: 50px;
//     max-width: 400px;
//     width: 80%;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     border-radius: 4px;
//     padding: 20px 40px;
//     border: 1px solid ${props => hexToRgba(props.theme.accent, 0.5)};
//     background-color: ${props => hexToRgba(props.theme.accent, 0.05)};

//     h1 {
//         font-family: 'Open Sans';
//         font-size: 14px;
//         font-weight: 400;
//         color: ${props => props.theme.accent};
//         a {
//             text-decoration: none;
//             font-weight: 500;
//             color: ${props => props.theme.primary};
//         }
//     }
// `;