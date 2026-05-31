import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import App from './app'


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
        ]
    }
])