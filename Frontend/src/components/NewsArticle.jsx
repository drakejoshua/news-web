import React from 'react'
import { FaUser } from 'react-icons/fa6'

export default function NewsArticle({ title, description, author, source, url, imageUrl }) {
    return (
        <div
            className="
                flex
                gap-4
                bg-gray-100 dark:bg-gray-800
                p-4
                rounded-md
            "
        >
            <img src={imageUrl} alt="News Article" className="w-2/5 h-full aspect-square rounded-md shrink-0 object-cover" />
            
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
}
