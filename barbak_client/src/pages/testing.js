import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";

const StyledTesting = styled.div`
    height: 100vh;
    display: flex;
    flex-direction: column;
`;

const TestThemes = styled.div.attrs(() => ({
    children: <>
        <div/>
        <div/>
        <div/>
        <div/>
    </>
}))`
    height: 100px;
    display: flex;
    flex-direction: row;

    div {
        flex: 1 1 auto;
    }
    div:nth-child(1) {
        background-color: ${props => props.theme.primary};
    }
    div:nth-child(2) {
        background-color: ${props => props.theme.secondary};
    }
    div:nth-child(3) {
        background-color: ${props => props.theme.accent};
    }
    div:nth-child(4) {
        background-color: ${props => props.theme.background};
    }
`;

const TestFonts = styled.div.attrs(() => ({
    children: <>
        <div className="poppins">
            <h1>Poppins</h1>
            <h2>Poppins</h2>
            <h3>Poppins</h3>
        </div>
        <div className="montserrat">
            <h1>Montserrat</h1>
            <h2>Montserrat</h2>
            <h3>Montserrat</h3>
        </div>
        <div className="opensans">
            <h1>Open Sans</h1>
            <h2>Open Sans</h2>
            <h3>Open Sans</h3>
        </div>
    </>
}))`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    font-size: 30px;

    .poppins {
        font-family: 'Poppins';
        font-size: 1em;
        h1 {
            font-weight: 300;
            font-size: 1em;
        }
        h2 {
            font-weight: 400;
            font-size: 1em;
        }
        h3 {
            font-weight: 500;
            font-size: 1em;
        }
    }

    .montserrat {
        font-family: 'Montserrat';
        font-size: 1em;
        h1 {
            font-weight: 300;
            font-size: 1em;
        }
        h2 {
            font-weight: 400;
            font-size: 1em;
        }
        h3 {
            font-weight: 500;
            font-size: 1em;
        }
    }

    .opensans {
        font-family: 'Open Sans';
        font-size: 1em;
        h1 {
            font-weight: 300;
            font-size: 1em;
        }
        h2 {
            font-weight: 400;
            font-size: 1em;
        }
        h3 {
            font-weight: 500;
            font-size: 1em;
        }
    }
`;

const TestRedux = styled.div`
    font-family: 'Courier New', Courier, monospace;
    font-size: 10px;
`;

class Testing extends React.Component {
    render() {
        const { userId, username, userEmail, userProfileImage, userExperience } = this.props;
        return <StyledTesting>
            <TestThemes/>
            <TestFonts/>
            <TestRedux>
                <h1>{userId}</h1>
                <h1>{username}</h1>
                <h1>{userEmail}</h1>
                <h1>{userProfileImage}</h1>
                <h1>{userExperience}</h1>
            </TestRedux>
        </StyledTesting>;
    }
}

const mapStateToProps = (state) => {
    return {
        userId: state.userReducer.user_id,
        username: state.userReducer.user_name,
        userEmail: state.userReducer.user_email,
        userProfileImage: state.userReducer.user_profile_image,
        userExperience: state.userReducer.user_experience
    }
}

export default connect(mapStateToProps, null)(Testing);