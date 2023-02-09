import styled from "styled-components";


export const StyledLogin = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: 100vh;
    background-color: ${props => props.theme.secondary};

    .authentication {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
`;

export const AuthenticationForm = styled.form`
    max-width: 440px;
    width: 80%;
    height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 50px;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid ${props => props.theme.tertiary};
    
    input:focus,
    select:focus,
    textarea:focus,
    button:focus {
        outline: none;
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