"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if a user session exists, if so, redirect to /dashboard
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/dashboard"); // Redirect to dashboard if user is already logged in
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
      router.push("/dashboard"); // Navigate to the dashboard on successful login
    }
  };

  // Function to handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? `Signup failed: ${error.message}` : "Signup successful! Please check your email to confirm.");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100" style={{ backgroundImage: 'url("/admin.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}>

      <div className="ml-20 w-full max-w-md p-8 space-y-6 bg-[white] shadow-lg rounded-lg">
        <Image
          className="dark:invert"
          src="/adminlogo.svg"
          alt="Next.js logo"
          width={380}
          height={38}
          priority
        />

        {/* Tab Selection */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setTab("login")}
            className={`py-2 px-4 font-semibold rounded-lg ${tab === "login" ? "bg-black text-white" : "bg-gray-200"}`}
          >
            Login
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`py-2 px-4 font-semibold rounded-lg ${tab === "signup" ? "bg-black text-white" : "bg-gray-200"}`}
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
              className="w-full px-4 py-2 font-semibold text-white bg-black rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
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
              className="w-full px-4 py-2 font-semibold text-white bg-black rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
