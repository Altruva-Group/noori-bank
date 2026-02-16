import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Home from "../../pages/home";
import Dashboard from "../../pages/user/dashboard";
import Register from "../../pages/register";

export default function Router({account, wallet}) {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Home />,
        },
        {
            path: "/register",
            element:  wallet ? (account ? <Dashboard /> : <Register />) : <Home />
        },
        {
            path: "/dashboard",
            element: wallet ? account ? <Dashboard /> : <Register /> : <Home />,
        //     children: [
        //         {
        //             path: "/dashboard/deposit",
        //             element: <Deposit />,
        //         },
        //         {
        //             path: "/dashboard/transfer",
        //             element: <Transfer />,
        //         },
        //         {
        //             path: "/dashboard/withdraw",
        //             element: <Withdraw />,
        //         }
        //     ]
        },
        // {
        //     path: "/admin",
        //     element: <Admin />,
        //     children: [
        //         {
        //             path: "/admin/token",
        //             element: <Token />,
        //         },
        //         {
        //             path: "/admin/vault",
        //             element: <Vault />,
        //         }
        //     ]
        // }
    ])

    return (
        <RouterProvider router={router} />
    )
}