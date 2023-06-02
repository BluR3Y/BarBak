import styled from "styled-components";
import { extraLarge, extraSmall } from "@/config/breakpoints";

export const StyledHome = styled.div`
    min-height: 100vh;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
`;

export const MainContainer = styled.div`
    margin-top: 50px;
    flex-basis: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 35px;
    max-width: 1160px;

    @media screen and (max-width: ${extraLarge.min}px) {
        flex-basis: 94%;
    }
`;