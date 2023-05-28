import AuthInput from "@/components/shared/authInput";
import './authInput.stories.css';

export default {
    title: 'AuthInput',
    component: AuthInput
}

const Template = args => <AuthInput {...args} />

export const Regular = Template.bind({})
Regular.args = {
    inputType: 'text',
    inputValue: '',
    labelText: 'Username',
    errorText: '',
    inputCallback: undefined
}

export const Error = Template.bind({})
Error.args = {
    inputType: 'password',
    inputValue: '',
    labelText: 'Password',
    errorText: 'Password must contain: \n * Atleast one UpperCase Letter \n * Atleast one Number',
    inputCallback: undefined
}