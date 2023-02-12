import {
    SET_USER_ID,
    SET_USER_NAME,
    SET_USER_EMAIL,
    SET_USER_PROFILE_IMAGE
} from './actions';

const initialState = {
    user_id: null,
    user_name: null,
    user_email: null,
    user_profile_image: null
};

function userReducer(state = initialState, action) {
    switch(action.type) {
        case SET_USER_ID:
            return {...state, user_id: action.payload};
        case SET_USER_NAME:
            return {...state, user_name: action.payload};
        case SET_USER_EMAIL:
            return {...state, user_email: action.payload};
        case SET_USER_PROFILE_IMAGE:
            return {...state, user_profile_image: action.payload};
        default:
            return state;
    }
};

export default userReducer;