import React from "react"
import { Github } from "lucide-react"
import Logo from "../assets/Logo.png"

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 z-20 w-full bg-[#01aac1] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-default">
            <img src={Logo} alt="logo" className="h-8 w-8 rounded-xl" />
            <span className="ml-4 text-2xl font-semibold text-white">Zeno</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="https://github.com/Shubham-1068" target="_blank" className="flex items-center">
              <Github className="h-6 w-6 text-white" />
              <span className="ml-2 text-lg font-semibold text-white">Github</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

