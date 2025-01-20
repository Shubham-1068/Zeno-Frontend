import React from "react";
import { Github } from "lucide-react";
import Logo from "../assets/Logo.png";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 z-20 w-full bg-[#01aac1] shadow-lg transition-shadow duration-300 px-3 md:px-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-default">
            <img src={Logo} alt="logo" className="h-10 w-10 rounded-2xl shadow-md" />
            <span className="ml-4 text-3xl font-bold text-white transition-transform duration-300">Zeno</span>
          </div>
          <div className="flex items-center space-x-6">
            <a 
              href="https://github.com/Shubham-1068" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center transition-transform duration-300 hover:scale-105"
            >
              <Github className="h-6 w-6 text-white hover:text-gray-200 transition-colors duration-300" />
              <span className="ml-2 text-base font-semibold text-white hover:text-gray-200 transition-colors duration-300 hidden md:block">Github</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
