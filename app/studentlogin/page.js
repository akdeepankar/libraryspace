"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function StudentAuthPage() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [name, setName] = useState("");


  useEffect(() => {
    // Check if a user session exists, if so, redirect to /dashboard
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/library"); // Redirect to dashboard if user is already logged in
      }
    };
    checkSession();
  }, []);

  // Function to handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(`Login failed: ${error.message}`);
    } else {
      setMessage("Login successful!");
      router.push("/library"); // Navigate to the dashboard on successful login
    }
  };

  // Function to handle signup
  // Function to handle signup
const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
  
    // Create a new user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
  
    if (error) {
      setMessage(`Signup failed: ${error.message}`);
      return;
    }
  
    if (data.user) {
      // Insert user details into the Students table
      const { error: insertError } = await supabase
        .from("Students")
        .insert([
          { uid: data.user.id, name: name, email: email }
        ]);
  
      if (insertError) {
        setMessage(`Signup successful, but failed to save data: ${insertError.message}`);
      } else {
        setMessage("Signup successful! You may Login!");
      }
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-lg">
      <Image
          className="dark:invert"
          src="/studentlogo.svg"
          alt="Next.js logo"
          width={380}
          height={38}
          priority
        />        
        {/* Tab Selection */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setTab("login")}
            className={`py-2 px-4 font-semibold rounded-lg ${tab === "login" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Login
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`py-2 px-4 font-semibold rounded-lg ${tab === "signup" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign Up
            </button>
          </form>
        )}

        {/* Message Display */}
        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
}
