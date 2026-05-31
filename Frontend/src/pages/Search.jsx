import { useSearchNewsByKeywordQuery } from "../app/services/newsApiData"
import NewsArticle from "../components/NewsArticle"

export function Component() {
    const query = new URLSearchParams( window.location.search ).get( 'q' )

    const { data, error, isLoading } = useSearchNewsByKeywordQuery( query )

    const errorMessage =
        error?.data?.error?.message ||
        error?.message ||
        'Something went wrong'

    return (
        <div className="mt-4">
            {/* loading state */}
            { isLoading && <p>Loading...</p> }

            {/* error state */}
            { error && <p>Error: { errorMessage }</p> }

            {/* news articles - empty and non-empty states */}
            { data && data.data.articles.length > 0 ? (
                <div className="flex flex-col gap-4">
                    { data.data.articles.map( ( article ) => (
                        <NewsArticle 
                            key={article.url}
                            title={article.title}
                            description={
                                article.description ||
                                'No description available.'
                            }
                            author={article.author || 'Unknown'}
                            source={article.source?.name || 'Unknown'}
                            url={article.url}
                            imageUrl={article.urlToImage}
                        />
                    ) ) }
                </div>
            ) : (
                !isLoading && !error && <p>No news articles found.</p>
            ) }
        </div>
    )
}
