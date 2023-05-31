import styled from "styled-components";

export const StyledHomeSection = styled.div`    
    display: flex;
    flex-direction: column;
    font-size: 19px;
    color: ${props => props.theme.type === 'classic' ? '#000' : '#fff'};
    user-select: none;
`;

export const SectionHeader = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 10px 0;
    overflow: hidden;
    height: 30px;
    margin-bottom: 5px;

    font-family: 'Poppins';
    font-weight: 600;
    h1 {
        flex: 1 1 auto;
        font-size: 1em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        height: inherit;
    }
    a {
        text-decoration: none;
        padding: 0 10px;
        color: inherit;
        font-size: 0.8em;
        font-weight: 500;
        white-space: nowrap;
        height: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .sectionNavigation {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        flex-wrap: nowrap;
        height: inherit;
        min-width: 55px;
        margin-left: 10px;

        button {
            height: 1.7em;
            aspect-ratio: 1;
            border-radius: 50%;
            border: none;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: ${props => props.theme.container};
            cursor: pointer;

            svg {
                height: 1.1em;
                fill: ${props => props.theme.accent};
            }
        }
    }
`;

export const SectionContainer = styled.div`
    display: flex;
    flex-direction: row;
    height: 300px;
    gap: 15px;
`;