import { createBrowserRouter } from 'react-router-dom'
import { Home } from './pages/home'
import { Login } from './pages/login'
import { Register } from './pages/register'
import { CarDetail } from './pages/car'
import { Dashboard } from './pages/dashbord'
import { New } from './pages/dashbord/new'
import { EditCar } from './pages/dashbord/edit'

import { Layout } from './components/layout'

import { Private } from './routes/Private'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/car/:id',
        element: <CarDetail />
      },
      {
        path: '/dashboard',
        element: <Private><Dashboard /> </Private>
      },
      {
        path: '/dashboard/new',
        element: <Private> <New /> </Private>
      },
      {
        path: '/dashboard/edit/:id',
        element: <Private> <EditCar /> </Private>
      },
    ],
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  }
])
