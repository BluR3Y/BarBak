import React from "react";
import { StyledNavigation, NavLogo, NavContent } from "@/styles/components/navigation/navigation";
import { connect } from "react-redux";

import UserProfile from "./userProfile";
import GuestAuth from "./guestAuth";

class Navigation extends React.Component {

    render() {
        const { userInfo } = this.props;
        return <StyledNavigation>
            <NavLogo/>
            <NavContent>
                { userInfo
                    ? <UserProfile userInfo={userInfo}/>
                    : <GuestAuth /> }
            </NavContent>
        </StyledNavigation>;
    }
};

const mapStateToProps = (state) => {
    return {
        userInfo: state.userReducer.userInfo
    }
}

export default connect(mapStateToProps)(Navigation);