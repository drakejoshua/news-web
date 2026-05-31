import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'


export const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />
    },
    {
        path: "/search",
        lazy: () => import("./pages/Search")
    }
])