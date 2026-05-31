import { useDispatch, useSelector } from "react-redux"
import { RouterProvider } from 'react-router-dom'
import { router } from "./routes"
import { FaNewspaper, FaRegMoon, FaRegSun } from "react-icons/fa6"
import { toggleTheme } from "./features/themeSlice"

function App() {
    const dispatch = useDispatch()
    const theme = useSelector( ({ theme }) => theme.value )

    return (
        <div className={`
            ${ theme === "dark" ? "dark" : "" }
            h-dvh w-screen
            bg-white text-black
            dark:bg-black dark:text-white
        `}>
            <div 
                className="
                    max-w-xl
                    mx-auto
                    pt-8 pb-6 px-2
                    h-full overflow-y-auto
                    scrollbar-none
                "
            >
                {/* logo */}
                <div 
                    className="
                        flex
                        gap-3
                        items-center
                        text-2xl
                        font-medium
                        justify-center
                    "
                >
                    <FaNewspaper 
                        className="
                            text-green-600 text-3xl
                            dark:text-green-400
                        " 
                    />

                    <span>
                        News Web
                    </span>

                    <button className="ml-auto" onClick={() => dispatch(toggleTheme())}>
                        { theme === "dark" ? 
                            <FaRegSun className="text-gray-700 dark:text-gray-200 text-2xl" /> : 
                            <FaRegMoon className="text-gray-700 dark:text-gray-200 text-2xl" /> }
                    </button>
                </div>

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
                />

                <RouterProvider router={ router } />
            </div>
        </div>
    )
}

export default App
