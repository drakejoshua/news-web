import React from 'react'
import { FaUser } from 'react-icons/fa6'

const NewsArticle = React.memo(({ title, description, author, source, url, imageUrl, index }) => {
    return (
        <div
            className="
                flex
                lg:flex-row flex-col
                gap-4
                bg-gray-100 dark:bg-gray-800
                p-4
                rounded-md
            "
        >
            <img src={imageUrl} alt="News Article" 
                className="lg:w-2/5 w-full h-full aspect-square rounded-md shrink-0 object-cover" 
                fetchPriority={ index === 0 ? "high" : "low"} 
                loading={ index === 0 ? "eager" : "lazy" } />
            
            <div className="flex flex-col gap-2">
                {/* article title & link */}
                <h2 className="text-xl font-bold">
                    <a href={url} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-white">
                        {title}
                    </a>
                </h2>

                {/* article description */}
                <p className="text-gray-800 dark:text-gray-200">
                    {description}
                </p>

                {/* article author and source */}
                <div className="flex items-center gap-2 dark:text-white">
                    <FaUser /> <span>{author} ( {source} )</span>
                </div>
            </div>
        </div>
    )
})


export default NewsArticle