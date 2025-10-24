"use client";

import { useState } from "react";
import { FaUserCircle, FaSearch, FaMusic, FaCompactDisc, FaNewspaper, FaBars } from "react-icons/fa";  // Replaced FaAlbumCollection with FaCompactDisc

export default function MusicDashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={`w-64 bg-gray-800 p-4 ${isSidebarOpen ? "block" : "hidden"} md:block`}> 
        <h1 className="text-2xl font-bold text-center mb-6">Fwaya Music</h1>
        <ul className="space-y-4">
          <li className="flex items-center space-x-3 hover:text-blue-500 cursor-pointer">
            <FaMusic /> <span>Songs</span>
          </li>
          <li className="flex items-center space-x-3 hover:text-blue-500 cursor-pointer">
            <FaCompactDisc /> <span>Albums</span> {/* Updated icon */}
          </li>
          <li className="flex items-center space-x-3 hover:text-blue-500 cursor-pointer">
            <FaNewspaper /> <span>News</span>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-grow p-4">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg mb-6">
          {/* Sidebar Toggle (for mobile) */}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden text-xl">
            <FaBars />
          </button>

          {/* Search Bar */}
          <div className="flex-grow flex items-center bg-gray-700 px-4 py-2 rounded-lg">
            <FaSearch className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search songs, albums, news..." 
              className="bg-transparent outline-none text-white pl-2 flex-grow"
            />
          </div>

          {/* Profile & Library */}
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 px-4 py-2 rounded-lg">Library</button>
            <FaUserCircle className="text-3xl cursor-pointer" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold">Welcome to Fwaya Music</h2>
          <p className="text-gray-400 mt-2">Explore your favorite songs, albums, and news.</p>
        </div>
      </div>
    </div>
  );
}
