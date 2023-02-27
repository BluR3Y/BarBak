import React from "react";
import { StyledNavigation, NavLogo } from "@/styles/components/navigation/navigation";

class Navigation extends React.Component {

    render() {
        return <StyledNavigation>
            <NavLogo/>
        </StyledNavigation>;
    }
};

export default Navigation;