"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BookDetailsModal from "../components/BookDetails";
import SearchModal from "../components/SearchModal"; 
import { fetchGraphQL } from "../components/graphqlApi";
import OpenLibrary from "../components/OpenLibrary";


const LibraryDashboard = () => {
  const [activeTab, setActiveTab] = useState("catalogue");
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [user, setUser] = useState(null);
  const [userEditData, setUserEditData] = useState({});
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [issuedHistory, setIssuedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const [showSearchModal, setShowSearchModal] = useState(false); // State for the search modal


  
  const fetchRecommendations = async () => {
    setRecommendationsLoading(true);
    setShowModal(true);
  
    try {
      const graphqlQuery = `
        query GenerateText($instruction: String!, $prompt: String!) {
          generateText(instruction: $instruction, prompt: $prompt)
        }
      `;
  
      const variables = {
        instruction:
          "Given a list of books, recommend 6 books similar to them. Only the Names and Author. Use Markdown Format.",
        prompt: "Recommend 6 Books for the user like " + issuedHistory.join("\n") + "\n",
      };
  
      const data = await fetchGraphQL(graphqlQuery, variables);
  
      const generatedText = data?.generateText || "No recommendations available.";
  
      // Process the response
      setRecommendedBooks(
        generatedText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line) // Filter out empty lines
      );
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setRecommendationsLoading(false);
    }
  };
  
  // Fetch user details
  const fetchUserDetails = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      router.push("/auth"); // Redirect to login if not authenticated
      return;
    }

    const { data: profile } = await supabase
      .from("Students")
      .select("name, email, class, section, roll")
      .eq("uid", session.user.id)
      .single();

    setUser({ ...session.user, ...profile });
    setUserEditData({ name: profile.name, class: profile.class, section: profile.section, roll: profile.roll });
  };

  // Fetch books in the library catalogue
  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("Books")
      .select("id, title, author, about, cover, isbn, category, status");
    if (error) console.error("Error fetching books:", error);
    setBooks(data);
    setFilteredBooks(data); // Initialize filtered books as all books
    setLoading(false);
  };

  const fetchIssuedBooks = async () => {
    try {
      if (!user) return; // Ensure the user is authenticated
  
      // Fetch issuedBooks and issuedHistory columns
      const { data, error } = await supabase
        .from("Students")
        .select("issuedBooks, issuedHistory")
        .eq("uid", user.id)
        .single(); // Fetch a single row for the logged-in user
  
      if (error) {
        console.error("Error fetching issued books:", error.message);
        return;
      }
  
      // Update the state with the fetched data
      setIssuedBooks(data.issuedBooks || []); // Ensure the field is safely handled
      setIssuedHistory(data.issuedHistory || []); // Same for history
    } catch (err) {
      console.error("Unexpected error fetching issued books:", err);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchIssuedBooks();
    }
  }, [user]);
  
  

  useEffect(() => {
    fetchUserDetails();
    fetchBooks();
  }, []);

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // Redirect to login page
  };

  // Handle active tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle search input change
  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = books.filter((book) => 
      book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm)
    );
    setFilteredBooks(filtered);
  };

  // Handle book click to show details
  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  // Save user profile edit
  const handleEditSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("Students")
        .update({
          class: userEditData.class || "",
          section: userEditData.section || "",
          roll: userEditData.roll || "",
          name: userEditData.name || "",
        })
        .eq("uid", user.id);

      if (error) {
        console.error("Error updating profile:", error.message);
      } else {
        setUser((prev) => ({ ...prev, ...userEditData }));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  // Handle loading state
  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Image
    className="dark:invert bg-white rounded-xl"
    src="/studentlogo.svg"
    alt="Next.js logo"
    width={380}
    height={38}
    priority
  /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 " >

      
      {/* Fixed Header with Tabs */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-50 to-blue-300 shadow-md z-10" >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center border-b">
          {/* Logo and User info */}
          <div className="flex flex-col">
          <Image
          className="dark:invert pb-2"
          src="/studentlogo.svg"
          alt="Next.js logo"
          width={280}
          height={38}
          priority
        />   
            <p className="ml-2 text-xl text-gray-900 font-bold"><span className="font-normal">Welcome,</span> {user?.name}</p>
            <p className="ml-2 text-sm text-gray-600">{user?.email}</p>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-800 hover:bg-gradient-to-l from-red-600 to-red-800 text-white rounded-lg "
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <nav className="max-w-7xl mx-auto px-6 py-2 flex space-x-10 justify-center">
        {["catalogue", "openLibrary", "issued", "history", "user"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`relative text-lg font-medium text-gray-600 py-2 transition-all ${
              activeTab === tab
                ? "text-blue-600"
                : "hover:text-blue-600"
            }`}
          >
            {tab === "catalogue" && "📚 Books Catalogue"}
            {tab === "openLibrary" && "📖 Open Library"}
            {tab === "issued" && "📗 Issued Books"}
            {tab === "history" && "📕 Issued History"}
            {tab === "user" && "👤 User Profile"}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-800 to-blue-400"></span>
            )}
          </button>
        ))}
      </nav>

      </header>

      {/* Main Content with Padding */}
      <div className="pt-28 px-6 pb-12">
       

{/* Floating Action Bar */}
<div className="fixed bottom-6 left-6 z-50 flex items-center space-x-2">
        <button
          onClick={fetchRecommendations}
          className="px-4 py-3 bg-gradient-to-r from-pink-700 to-pink-400 text-white font-semibold flex items-center rounded-full shadow-lg hover:bg-gradient-to-l from-pink-700 to-purple-400 hover:text-white transition"
        >
          Recommend ✨
        </button>

        {/* Search Button */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="px-4 py-3 bg-gradient-to-r from-blue-100 to-blue-400 hover:bg-gradient-to-l from-blue-800 to-blue-400 text-white font-semibold flex items-center rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          Search 🔍
        </button>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />


{/* Modal */}
{showModal && (
  <>
    {/* Overlay */}
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40"
      onClick={() => setShowModal(false)}
    ></div>

    {/* Modal Content */}
    <div
      className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-50 overflow-y-auto"
    >
      <div className="p-5">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
        {recommendationsLoading ? (
          <div className="flex justify-center items-center mt-20">
            <p className="text-purple-600 text-lg">Fetching recommendations...</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-purple-700 mb-4">
              Recommendations
            </h2>
            {recommendedBooks.length > 0 ? (
              <ul className="space-y-3 ">
                {recommendedBooks.map((book, index) => (
                  <li
                    key={index}
                    className="p-4 border rounded-lg bg-gradient-to-r from-blue-100 to-purple-200 "
                  >
                    {book}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">
                No recommendations available.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  </>
)}

    
        {/* Tab Content */}
        <div>
          {activeTab === "catalogue" && (
            <div>
              <h2 className="text-3xl font-semibold text-gray-800 mb-6 mt-20"></h2>
              
              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by Book Title or Author..."
                  onChange={handleSearch}
                  className="w-full p-3 border bg-gray-100 border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Books Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-8">
                {filteredBooks.map((book) => (
                  <div 
                    key={book.id} 
                    className="bg-gradient-to-r from-blue-100 to-pink-50 p-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 cursor-pointer"
                    onClick={() => handleBookClick(book)}
                  >
                    <Image
                      src={book.cover || "/cover.gif"}
                      alt={book.title}
                      height={200}
                      width={200}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <h3 className="text-lg font-semibold mt-2 text-gray-900">{book.title}</h3>
                    <p className="text-sm text-gray-600">{book.author}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

{activeTab === "openLibrary" && <OpenLibrary />}

{activeTab === "issued" && (
  <div className="mt-20">
    {issuedBooks.length > 0 ? (
      <ul className="space-y-2">
        {issuedBooks.map((book, index) => (
          <li
            key={index}
            className="p-4 bg-white shadow-md rounded-lg text-gray-800"
          >
            {book}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-lg text-gray-600">No books currently issued.</p>
    )}
  </div>
)}



{activeTab === "history" && (
  <div className="mt-20">
    {issuedHistory.length > 0 ? (
      <ul className="space-y-4">
        {issuedHistory.map((book, index) => (
          <li
          key={index}
          className="p-4 bg-white shadow-md rounded-lg text-gray-800"
        >
          {book}
        </li>
        ))}
      </ul>
    ) : (
      <p className="text-lg text-gray-600">No history of issued books.</p>
    )}
  </div>
)}



{activeTab === "user" && (
  <div className="p-6 mt-20 max-w-3xl mx-auto bg-white rounded-lg shadow-lg">
    <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Edit Profile</h2>
    <form className="space-y-6">
      {/* Name and Class Row */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-lg font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={userEditData.name || ""}
            onChange={(e) => setUserEditData({ ...userEditData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-lg font-medium text-gray-700 mb-2">Class</label>
          <input
            type="text"
            value={userEditData.class || ""}
            onChange={(e) => setUserEditData({ ...userEditData, class: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your class"
          />
        </div>
      </div>

      {/* Section and Roll Number Row */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-lg font-medium text-gray-700 mb-2">Section</label>
          <input
            type="text"
            value={userEditData.section || ""}
            onChange={(e) => setUserEditData({ ...userEditData, section: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your section"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-lg font-medium text-gray-700 mb-2">Roll No.</label>
          <input
            type="text"
            value={userEditData.roll || ""}
            onChange={(e) => setUserEditData({ ...userEditData, roll: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your roll number"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="text-center">
        <button
          onClick={handleEditSave}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all"
        >
          Save Changes
        </button>
      </div>
    </form>
  </div>
)}


        </div>
      </div>

       {/* Book Details Modal on the Side */}
       {selectedBook && (
        <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
};

export default LibraryDashboard;
