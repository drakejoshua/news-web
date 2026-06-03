import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function SearchBar() {
    const [ searchTerm, setSearchTerm ] = useState( '' )

    let navigateTo = useNavigate()

    return (
        <>
            {/* search bar */} 
            <input
                type="text"
                placeholder="Search for news..."
                className="
                    w-full
                    mt-5
                    px-4 py-2
                    rounded-md
                    border border-gray-300
                    focus:outline-none focus:ring-2 
                    focus:ring-green-600 focus:border-transparent
                    dark:focus:ring-green-400
                    placeholder-gray-500 dark:placeholder-gray-400
                "
                value={ searchTerm }
                onChange={ ( e ) => setSearchTerm( e.target.value ) }
                onKeyDown={ ( e ) => {
                    if ( e.key === 'Enter' && searchTerm.trim() !== '' ) {
                        navigateTo( `/search?q=${ encodeURIComponent( searchTerm.trim() ) }` )
                    }
                } }
            />
        </>
    )
}
