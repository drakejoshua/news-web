import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import themeReducer from '../features/themeSlice.js'
import { newsApi } from './services/newsApiData.js'

export const store = configureStore({
    reducer: {
        theme: themeReducer,
        [ newsApi.reducerPath ]: newsApi.reducer
    },
    // apply caching on the newsAPI 
    middleware: ( getDefaultMiddleware ) => getDefaultMiddleware().concat( newsApi.middleware )
})

setupListeners( store.dispatch )