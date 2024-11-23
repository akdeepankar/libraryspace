"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function StudentAuthPage() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/library");
      }
    };
    checkSession();
  }, []); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(`Login failed: ${error.message}`);
    } else {
      setMessage("Login successful!");
      router.push("/library");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(`Signup failed: ${error.message}`);
      return;
    }

    if (data.user) {
      const { error: insertError } = await supabase
        .from("Students")
        .insert([{ uid: data.user.id, name: name, email: email }]);

      if (insertError) {
        setMessage(`Signup successful, but failed to save data: ${insertError.message}`);
      } else {
        setMessage("Signup successful! You may Login!");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" style={{ backgroundImage: 'url("/student.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="w-full max-w-lg px-8 py-10 space-y-8 bg-white rounded-xl shadow-md">
        <div className="flex justify-center">
          <Image src="/studentlogo.svg" alt="Logo" width={240} height={50} priority />
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center space-x-6">
          {["login", "signup"].map((option) => (
            <button
              key={option}
              onClick={() => setTab(option)}
              className={`py-2 px-6 text-lg font-medium rounded-lg transition ${
                tab === option ? "bg-black text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {option === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={tab === "login" ? handleLogin : handleSignup}
          className="space-y-5"
        >
          {tab === "signup" && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-gray-400"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-gray-400"
          />
          <button
            type="submit"
            className="w-full py-3 text-lg font-semibold text-white bg-black rounded-lg hover:bg-gray-800 focus:outline-none focus:ring focus:ring-gray-400"
          >
            {tab === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* Message Display */}
        {message && (
          <p className="mt-4 text-lg text-center text-red-600">{message}</p>
        )}
      </div>
    </div>
  );
}
