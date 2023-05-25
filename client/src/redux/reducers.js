import {
    SET_USER_INFO
} from './actions';

const initialState = {
    userInfo: null
};

function userReducer(state = initialState, action) {
    switch(action.type) {
        case SET_USER_INFO:
            return {...state, userInfo: action.payload};
        default:
            return state;
    }
};

export default userReducer;