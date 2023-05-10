import styled, { css } from "styled-components";

export const StyledInput = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 20px 0 5px 0;

    .inputContainer {
        position: relative;
        border: 1px solid ${props => props.theme.secondary};
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
            color: ${props => !props.isEmpty || props.isFocused ? props.theme.accent : props.theme.secondary };

            ${props => props.isFocused || !props.isEmpty ? css`
                top: -22px;
                left: 0;
            ` : css `
                left: 8px;
                opacity: 0.8;
                top: 50%;
                transform: translateY(-50%);
            `}
        }
        input {
            font-size: 16px;
            font-family: 'Open Sans';
            font-weight: 400;
            height: 35px;
            width: 100%;
            padding-left: 8px;
            border-radius: 5px;

            ${props => props.emptyError ? css`
                border: none;
            ` : css`
                border: 2px solid rgba(232, 33, 19, 0.8);
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
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 3px 2px;

            svg {
                height: 22px;
                width: auto;
            }
        }
        .passwordVisibility:focus {
            border: 2px solid ${props => props.theme.secondary};   
        }
    }

    h1 {
        font-size: 14px;
        font-family: 'Poppins';
        font-weight: 300;
        top: 100%;
        color: #e82113;
        line-height: 18px;
        margin-left: 8px;
    }
    
    input:focus,
    select:focus,
    textarea:focus,
    button:focus {
        outline: none;
    }
/* 
    ${props => props.theme.type === 'dark' && css`
        label {
            color: ${props.theme.secondary};
        }
        input {
            background-color: ${props.theme.accent};
        }
    `} */
`;
