import { FaNewspaper, FaRegSun, FaRegMoon } from "react-icons/fa6"
import { useRouteError } from "react-router-dom"
import { toggleTheme } from "../features/themeSlice"
import { useDispatch, useSelector } from "react-redux"

export default function RouteError() {
    const error = useRouteError()
    const dispatch = useDispatch()
    const theme = useSelector(({ theme }) => theme.value)

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

                <h1 className="text-2xl font-medium text-center mt-4">Oops!</h1>
                <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
                    Sorry, an unexpected error has occurred.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                    {error.statusText || error.message}
                </p>
            </div>
        </div>
    )
}
