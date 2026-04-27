import { Header } from "./header"
import { Outlet } from "react-router-dom"

export function Layout() {
  return (
    <div className="min-h-screen bg-[#f4f4f5] dark:bg-[#141414]">
      <Header />
      <Outlet />
    </div>
  )
}
