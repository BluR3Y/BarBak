import React from "react";
import PropTypes from "prop-types";

import { StyledInput } from '@/styles/components/shared/authInput';
import EyeClose from 'public/icons/eye-close.js';
import EyeOpen from 'public/icons/eye-open.js';

class AuthInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isFocused: false,
        }
    }

    componentDidMount() {
        if (this.props.inputType === 'password') {
            this.setState({ passwordVisible: false });
        }
    }

    render() {
        const { isFocused, passwordVisible } = this.state;
        const { inputValue, inputCallback, errorText, inputType, labelText } = this.props;
        return <StyledInput 
            isFocused={isFocused} 
            isEmpty={!inputValue.length}  
            isInvalid={!!errorText}
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

AuthInput.propTypes = {
    inputType: PropTypes.oneOf(['text','password']),
    inputValue: PropTypes.string.isRequired,
    labelText: PropTypes.string,
    errorText: PropTypes.string,
    inputCallback: PropTypes.func.isRequired
}

export default AuthInput;