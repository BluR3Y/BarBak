import React from "react";

import { StyledInput } from '@/styles/components/shared/authInput';
import EyeClose from 'public/icons/eye-close.js';
import EyeOpen from 'public/icons/eye-open.js';

export default class AuthInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            labelText: props.labelText || '',
            isFocused: false,
        }
    }

    componentDidMount() {
        if (this.props.inputType === 'password') {
            this.setState({ passwordVisible: false });
        }
    }

    render() {
        const { labelText, isFocused, passwordVisible } = this.state;
        const { inputValue, inputCallback, errorText, inputType } = this.props;
        return <StyledInput 
            isFocused={isFocused} 
            isEmpty={!inputValue.length}  
            emptyError={!errorText || !errorText.length}
        >
            <div className="inputContainer">
                <label htmlFor="input">{labelText}</label>
                <input 
                    type={inputType !== 'password' ? inputType : (passwordVisible ? 'text' : 'password')}
                    id='input'
                    value={inputValue}
                    onFocus={() => this.setState({ isFocused: true })}
                    onBlur={() => this.setState({ isFocused: false })}
                    onChange={(event) => inputCallback(event.target.value)}
                />
                { inputType === 'password' && (
                <button 
                    className="passwordVisibility" 
                    type="button"
                    onClick={() => this.setState(prevState => ({ passwordVisible: !prevState.passwordVisible }))}
                >
                    { passwordVisible ? <EyeClose/> : <EyeOpen/> }
                </button>) }
            </div>
            { errorText && (
                <div className="errorContainer">
                    { errorText.split('\n').map((item, key) => {
                        return <h1 key={key}>{item}</h1>
                    }) }
                </div>
            ) }
        </StyledInput>;
    }
}