import React from 'react'
import { createRoot } from 'react-dom/client'
import { router } from './App'
import './index.css'

import { RouterProvider } from 'react-router-dom'
import AuthProvider from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

import { register } from 'swiper/element/bundle'
register();
import 'swiper/swiper.css';

import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <Toaster
        position='top-right'
        reverseOrder={false}
        toastOptions={{
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #111)',
          }
        }}
      />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
