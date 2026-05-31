import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const newsApi = createApi({
    reducerPath: 'newsApi',
    baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_URL }),
    endpoints: function( builder ) {
        return {
            // get all news articles
            getAllNews: builder.query({
                query: ( category ) => 
                    category ? `/feed?category=${ category }` : '/feed'
            }),
            // search news by keyword
            searchNewsByKeyword: builder.query({
                query: ( keyword ) => `/search?q=${ keyword }`
            })
        }
    }
})

export const {
    useGetAllNewsQuery,
    useSearchNewsByKeywordQuery
} = newsApi