import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import App from './app'
import RouteError from "./pages/RouteError.jsx"


export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: "search",
                lazy: () => import("./pages/Search")
            }
        ],
        errorElement: <RouteError />
    }
])