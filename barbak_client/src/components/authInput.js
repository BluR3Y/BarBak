import React from "react";

import { StyledInput } from '@/styles/components/authInput';

export default class AuthInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            labelText: props.labelText || '',
            isFocused: false,
        }
    }

    render() {
        const { labelText, isFocused } = this.state;
        return <StyledInput isFocused={isFocused} >
            <div className="inputContainer">
                <label for='input'>{labelText}</label>
                <input 
                    type='text' 
                    id='input'
                    onFocus={this.setState({ isFocused: true })}
                    onBlur={this.setState({ isFocused: false })}
                />
            </div>
        </StyledInput>;
    }
}