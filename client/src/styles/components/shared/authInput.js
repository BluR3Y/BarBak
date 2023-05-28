import styled, { css } from "styled-components";

export const StyledInput = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 20px 0 5px 0;

    .inputContainer {
        position: relative;
        border-radius: 6px;

        label {
            font-size: 16px;
            font-weight: 400;
            position: absolute;
            height: fit-content;
            line-height: 20px;
            pointer-events: none;
            user-select: none;
            transition-duration: 0.2s;
            font-family: 'Poppins';
            color: ${props => props.theme.accent};

            ${props => props.isFocused || !props.isEmpty ? css`
                top: -22px;
                opacity: 0.85;
                left: 0;
            ` : css `
                left: 8px;
                opacity: 0.7;
                top: 50%;
                transform: translateY(-50%);
            `}
        }
        input {
            font-size: 15px;
            font-family: 'Open Sans';
            font-weight: 400;
            height: 35px;
            width: 100%;
            padding-left: 8px;
            border-radius: 5px;
            box-sizing: border-box;
            border-style: solid;
            border-width: 1px;
            background-color: transparent;
            color: ${props => props.theme.accent};

            ${({isInvalid}) => isInvalid && css`
                border-color: rgba(232, 33, 19, 0.8) !important;
            `}
        }

        .passwordVisibility {
            background: transparent;
            position: absolute;
            right:6px;
            top: 0;
            bottom: 0;
            margin: auto;
            border: none;
            cursor: pointer;
            border-radius: 5px;
            height: fit-content;
            width: 32px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;

            svg {
                height: 22px;
                width: auto;
                fill: ${props => props.theme.accent};
            }
        }
        .passwordVisibility:focus-visible {
            border: 2px solid ${props => props.theme.secondary};   
        }
    }

    .errorContainer {
        padding: 4px 0;
        h1 {
            font-size: 14px;
            font-family: 'Poppins';
            font-weight: 300;
            top: 100%;
            color: #e82113;
            line-height: 18px;
            margin: 0 0 0 8px;
        }
        h1:not(:first-child) {
            padding-left: 25px;
            text-indent: -10px;
        }
    }
    
    input:focus,
    select:focus,
    textarea:focus,
    button:focus {
        outline: none;
    }
`;
