import React from "react";
import Logo from "../Assets/Logo.png";
import { Github } from "lucide-react";

function Navbar() {
  return (
    <div className="fixed top-0 z-20 w-full flex justify-center">
      <div className="w-[80%] flex justify-between items-center bg-[#070712] h-16">
        <span className="text-white text-3xl font-semibold text flex items-center gap-3 mt-3">
          <img src={Logo} alt="logo" className="w-12 rounded-2xl" />
          Zeno
        </span>
        <a href="https://github.com/Shubham-1068/" target="_blank" className="flex items-center gap-2 text-white rounded-2xl">
          <Github className="text-white" />
          Github
        </a>
      </div>
    </div>
  );
}

export default Navbar;
