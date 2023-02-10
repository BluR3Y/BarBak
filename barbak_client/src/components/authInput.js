import React from "react";

import { StyledInput } from '@/styles/components/authInput';

export default class AuthInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            labelText: props.labelText || '',
            errorText: props.errorText || '',
            isFocused: false,
        }
    }

    render() {
        const { labelText, isFocused } = this.state;
        const { inputValue, inputCallback, errorText, inputType } = this.props;
        return <StyledInput 
            isFocused={isFocused} 
            isEmpty={inputValue === ''}  
            emptyError={errorText === ''}
        >
            <div className="inputContainer">
                <label htmlFor="input">{labelText}</label>
                <input 
                    type={inputType}
                    id='input'
                    value={inputValue}
                    onFocus={() => this.setState({ isFocused: true })}
                    onBlur={() => this.setState({ isFocused: false })}
                    onChange={(event) => inputCallback(event.target.value)}
                />
            </div>
            { errorText && (
                <h1>{errorText}</h1>
            ) }
        </StyledInput>;
    }
}