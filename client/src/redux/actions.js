// export const SET_USER_ID = 'SET_USER_ID';
// export const SET_USER_NAME = 'SET_USER_NAME';
// export const SET_USER_EMAIL = 'SET_USER_EMAIL';
// export const SET_USER_PROFILE_IMAGE = 'SET_USER_PROFILE_IMAGE';

// export const setUserInfo = userInfo => dispatch => {
//     dispatch({
//         type: SET_USER_ID,
//         payload: userInfo.user_id,
//     });
//     dispatch({
//         type: SET_USER_NAME,
//         payload: userInfo.user_name,
//     });
//     dispatch({
//         type: SET_USER_EMAIL,
//         payload: userInfo.user_email,
//     });
//     dispatch({
//         type: SET_USER_PROFILE_IMAGE,
//         payload: userInfo.user_profile_image
//     });
// };

export const SET_USER_INFO = 'SET_USER';
export const SET_USER_PROFILE_IMAGE = 'SET_USER_PROFILE_IMAGE';

export const setUserInfo = userInfo => dispatch => {
    dispatch({
        type: SET_USER_INFO,
        payload: userInfo
    });
};

export const setUserProfileImage = userProfileImage => dispatch => {
    dispatch({
        type: SET_USER_PROFILE_IMAGE,
        payload: userProfileImage
    });
};