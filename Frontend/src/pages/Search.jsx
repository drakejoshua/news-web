import { useSearchParams } from "react-router-dom"
import { useSearchNewsByKeywordQuery } from "../app/services/newsApiData"
import NewsArticle from "../components/NewsArticle"

export function Component() {
    const [ searchParams ] = useSearchParams()
    const query = searchParams.get( 'q' )

    const { data, error, isLoading } = useSearchNewsByKeywordQuery( 
        query,
        { skip: !query }
    )
    
    const errorMessage =
        error?.data?.error?.message ||
        error?.message ||
        'Something went wrong'  

    const articles = data?.data?.articles ?? []

    return (
        <div className="mt-4">
            {/* loading state */}
            { isLoading && <p>Loading...</p> }

            {/* error state */}
            { error && <p>Error: { errorMessage }</p> }

            {/* news articles - empty and non-empty states */}
            { data && articles.length > 0 ? (
                <div className="flex flex-col gap-4">
                    { articles.map( ( article ) => (
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
