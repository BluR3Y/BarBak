import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import userReducer from './reducers';

const persistConfig = {
    key: 'root',
    storage
};

const appReducer = combineReducers({
    userReducer
});
// adding other reducers is possible by combining them with combineReducers
// Ex: const appReducer = combineReducers({ firstReducers, secondReducer, thirdReducer })

const rootReducer = (state, action) => {
    if (action.type === 'SIGNOUT_REQUEST') {
        // for all keys define a persistConfig(s)
        persistConfig.storage.removeItem('persist:root');
        // storage.remove('persist:otherKey(s)')

        return appReducer(undefined, action);
    }
    return appReducer(state, action);
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(
    persistedReducer,
    applyMiddleware(thunk)
);
// // Using multiple middlewares is possible by chaining them
// // Ex: applyMiddleware(firstMiddle, secondMiddle, thirdMiddle)

export const persistor = persistStore(store);

// *** 'next-redux-persist' is recommended instead of 'redux-persist' for Next.js