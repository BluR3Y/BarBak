import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import axios from "axios";

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

const TestImageDownload = styled.img`
    width: 500px;
    height: auto;
    align-self: center;
`;

const TestRedux = styled.div`
    font-family: 'Courier New', Courier, monospace;
    font-size: 10px;
`;

class Testing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            profile_image: null
        };
    }

    static getInitialProps = async (ctx) => {
        const barbak_backend_uri = process.env.BARBAK_BACKEND;
        return { barbak_backend_uri };
    }

    componentDidMount() {
        if (this.props.user !== null)
            this.getProfileImage();
    }

    getProfileImage = async () => {
        try {
            const { userInfo, barbak_backend_uri } = this.props;
            const res = await axios.get( barbak_backend_uri + '/assets/' + userInfo.profile_image, {
                withCredentials: true,
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            this.setState({ profile_image: url });
        } catch(err) {
            console.log(err)
        }
    }

    render() {
        const { userInfo } = this.props;
        const { profile_image } = this.state;
        return <StyledTesting>
            <TestThemes/>
            <TestFonts/>
            <TestRedux>
                {userInfo && Object.keys(userInfo).map((item,index) => <h1 key={index}>{`${item} : ${userInfo[item]}`}</h1>)}
            </TestRedux>
            { profile_image && <TestImageDownload src={profile_image} /> }
            <TestImageDownload src='/static/images/cocktail-1.jpg' />
        </StyledTesting>;
    }
}

const mapStateToProps = (state) => {
    return {
        userInfo: state.userReducer.userInfo
    }
}

export default connect(mapStateToProps, null)(Testing);