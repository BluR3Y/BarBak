import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
    /* Montserrat Fonts */
    @font-face {
        font-family: 'Montserrat';
        font-weight: 400;
        src: local('Montserrat'), url('/fonts/montserrat/Montserrat-Regular.ttf') format('truetype');
    }

    /* Poppins Fonts */
    @font-face {
        font-family: 'Poppins';
        font-weight: 400;
        src: local('Poppins'), url('/fonts/poppins/Poppins-Regular.ttf') format('truetype');
    }

    * {
        box-sizing: border-box;
        padding: 0;
        margin: 0;
    }

    html,
    body {
        max-width: 100vw;
        overflow-x: hidden;
        background-color: ${props => props.theme.background};
    }
`;
export default GlobalStyles;