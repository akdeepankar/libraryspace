"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import StudentPage from "../components/students";
import IssuedRecords from "../components/IssuedRecords";
import BooksPage from "../components/books";
import Overview from "../components/overview";
import Payments from "../components/payment";
import AdminSettings from "../components/AdminSettings"; 
import Announcement from "../components/Announcement"; // New Announcement component
import { AiOutlineHome, AiOutlineBook, AiOutlineUser, AiOutlineFileText, AiOutlineSetting, AiOutlineLogout, AiOutlineMoneyCollect, AiOutlineBell } from "react-icons/ai";
import Image from 'next/image';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      } else {
        router.push("/"); // Redirect to login if not authenticated
      }
    };
    checkUser();
  }, [router]);

  // Handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/"); // Redirect to the home or login page after logout
    } else {
      console.error("Error logging out:", error.message);
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "books":
        return <BooksPage />;
      case "students":
        return <StudentPage />;
      case "records":
        return <IssuedRecords />;
      case "settings":
        return <AdminSettings />;
      case "payments":
        return <Payments />;
      case "announcements": // New case for announcements
        return <Announcement />;
      default:
        return <p>Welcome to your dashboard!</p>;
    }
  };
  

  if (!isAuthenticated) return null; // Prevents rendering while checking authentication

  return (
    <div className="flex h-screen bg-[#e5e6ee]">
      {/* Sidebar */}
      <div className="w-1/6 p-4 bg-[#ffffff7e] text-black rounded-3xl ml-2 mt-2 mb-2 bg-opacity-80 backdrop-blur-lg shadow-lg flex flex-col justify-between">
        <div>
          <Image
            className="dark:invert m-5"
            src="/adminlogo.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center text-left py-2 px-4 rounded-lg ${activeTab === "overview" ? "bg-[#d6d7e1]" : "hover:bg-[#e5e6ee]"} text-black`}
              >
                <AiOutlineHome className="mr-2" /> Overview
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("books")}
                className={`w-full flex items-center text-left py-2 px-4 rounded-lg ${activeTab === "books" ? "bg-[#d6d7e1]" : "hover:bg-[#e5e6ee]"} text-black`}
              >
                <AiOutlineBook className="mr-2" /> Books
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("students")}
                className={`w-full flex items-center text-left py-2 px-4 rounded-lg ${activeTab === "students" ? "bg-[#d6d7e1]" : "hover:bg-[#e5e6ee]"} text-black`}
              >
                <AiOutlineUser className="mr-2" /> Students
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("records")}
                className={`w-full flex items-center text-left py-2 px-4 rounded-lg ${activeTab === "records" ? "bg-[#d6d7e1]" : "hover:bg-[#e5e6ee]"} text-black`}
              >
                <AiOutlineFileText className="mr-2" /> Issue Records
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("payments")}
                className={`w-full flex items-center text-left py-2 px-4 rounded-lg ${activeTab === "payments" ? "bg-[#d6d7e1]" : "hover:bg-[#e5e6ee]"} text-black`}
              >
                <AiOutlineMoneyCollect className="mr-2" /> Payments
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("announcements")} // Announcement tab button
                className={`w-full flex items-center text-left py-2 px-4 rounded-lg ${activeTab === "announcements" ? "bg-[#d6d7e1]" : "hover:bg-[#e5e6ee]"} text-black`}
              >
                <AiOutlineBell className="mr-2" /> Announcements
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center text-left py-2 px-4 rounded-lg ${activeTab === "settings" ? "bg-[#d6d7e1]" : "hover:bg-[#e5e6ee]"} text-black`}
              >
                <AiOutlineSetting className="mr-2" /> Admin Settings
              </button>
            </li>
          </ul>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center py-2 px-4 w-full text-left text-red-500 font-semibold bg-white rounded-xl hover:bg-red-700 hover:text-red-50"
        >
          <AiOutlineLogout className="mr-2" /> Logout
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 bg-[#ffffff7e] rounded-3xl m-2 shadow-lg overflow-y-auto">
        <div className="content-area">{renderContent()}</div>
      </div>
    </div>
  );
}
