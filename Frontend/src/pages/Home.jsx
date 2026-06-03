import { useState } from 'react'
import NewsArticle from '../components/NewsArticle'
import { useGetAllNewsQuery } from '../app/services/newsApiData'

export default function Home() {
    const categories = [
        'general',
        'business',
        'entertainment',
        'health',
        'science',
        'sports',
        'technology'
    ]

    const [activeCategory, setActiveCategory] = useState('general')

    const {
        isFetching,
        isError,
        error,
        data
    } = useGetAllNewsQuery(activeCategory)

    const errorMessage =
        error?.data?.error?.message ||
        error?.message ||
        'Something went wrong'

    return (
        <div className="mt-4">
            {/* categories */}
            <div
                className="
                    flex gap-2
                    overflow-x-auto
                    scrollbar-none
                "
            >
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`
                            bg-gray-200 text-gray-800
                            py-2 px-4 rounded-md
                            dark:bg-gray-700
                            dark:text-gray-300
                            ${
                                activeCategory === category
                                    ? 'bg-green-700 text-white dark:bg-green-500 dark:text-gray-900'
                                    : ''
                            }
                        `}
                    >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                ))}
            </div>

            {/* loading */}
            {isFetching && (
                <div className="mt-6 text-center text-gray-500">
                    Loading news articles...
                </div>
            )}

            {/* error */}
            {isError && (
                <div className="mt-6 text-center text-gray-500">
                    Error loading news articles. Error: {errorMessage}
                </div>
            )}

            {/* articles */}
            {!isFetching && !isError && (
                <div
                    className="
                        mt-6
                        flex flex-col gap-4
                    "
                >
                    {data?.data?.articles?.map((newsArticle, index) => (
                        <NewsArticle
                            key={newsArticle.url}
                            title={newsArticle.title}
                            description={
                                newsArticle.description ||
                                'No description available.'
                            }
                            author={newsArticle.author || 'Unknown'}
                            source={newsArticle.source?.name || 'Unknown'}
                            url={newsArticle.url}
                            imageUrl={newsArticle.urlToImage}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}