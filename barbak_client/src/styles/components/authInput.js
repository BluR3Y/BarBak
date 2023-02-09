import styled, { css } from "styled-components";

export const StyledInput = styled.div`
    display: flex;
    flex-direction: column;
    width: inherit;
    font-family: 'Poppins';

    .inputContainer {
        display: flex;
        flex-direction: column;
        position: relative;
        
        label {
            font-size: 16px;
            font-weight: 400;
            position: absolute;
            margin: auto;
            height: fit-content;
            line-height: 20px;
            ${props => props.isFocused ? css`
            
            ` : css `
                top: 0;
                bottom: 0;
                left: 8px;
            `}
                            background-color:red;
        }
        input {
            height: 30px;
            padding-left: 8px;
        }
    }
`;

// export const InputField = styled.div`
//     display: flex;
//     flex-direction: column;
//     width: 300px;

//     label {
//         font-size: 16px;
//         font-family: 'Montserrat', sans-serif;  
//         font-weight: 400;
//     }
//     input {
//         border: 1px solid green;
//         height: 25px;
//         border-radius: 5px;
//         font-family: 'Montserrat';
//         font-weight: 500;
//     }
// `;