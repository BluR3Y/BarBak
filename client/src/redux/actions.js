export const SET_USER_INFO = 'SET_USER';

export const setUserInfo = userInfo => dispatch => {
    dispatch({
        type: SET_USER_INFO,
        payload: userInfo
    });
};