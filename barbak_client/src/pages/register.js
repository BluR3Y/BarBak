import React from "react";

import { withOutAuth } from "@/hocs/authWrapper";
import { StyledRegister } from "@/styles/pages/register";

class Register extends React.Component {

    render() {
        return <StyledRegister>
            <h1>Register</h1>
        </StyledRegister>
    }
}

export default withOutAuth(Register, '/');
// export default withOutAuth(connect(mapStateToProps, mapDispatchToProps)(Login), '/');