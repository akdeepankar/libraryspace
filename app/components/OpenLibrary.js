"use client";

import { useState } from "react";
import { fetchGraphQL } from "../components/graphqlApi"; // Adjust the path to your fetchGraphQL utility

const OpenLibrary = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  const fetchBooks = async () => {
    if (!query.trim()) {
      alert("Please enter a search term.");
      return;
    }
  
    setLoading(true);
  
    try {
      const graphqlQuery = `
        query FetchOpenBook($searchTerm: String!) {
          fetchOpenBook(searchTerm: $searchTerm) {
            title
            author
            publishYear
            cover
            description
            key
          }
        }
      `;
  
      const variables = { searchTerm: query };
  
      const response = await fetchGraphQL(graphqlQuery, variables);
      const books = response?.fetchOpenBook;
  
      if (!books || books.length === 0) {
        setBooks([]);
        return;
      }
  
      const bookResults = books.map((book) => ({
        key: book.key,
        title: book.title || "Unknown Title",
        author: book.author || "Unknown Author",
        publishYear: book.publishYear || "Unknown Year",
        cover: book.cover || null,
        about: book.description || "No description available.",
      }));
      console.log("Fetched books:", bookResults);
      setBooks(bookResults);
    } catch (error) {
      console.error("Error fetching books via GraphQL:", error);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">
        Open Library Search
      </h2>
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for books..."
          className="border p-2 rounded-md w-full sm:w-64"
        />
        <button
          onClick={fetchBooks}
          className="bg-blue-500 text-white px-4 py-2 rounded-md ml-2"
        >
          Search
        </button>
      </div>
      {loading ? (
        <div>Loading books...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {books.length > 0 ? (
            books.map((book, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg shadow-md bg-white cursor-pointer"
                onClick={() => setSelectedBook(book)}
              >
                {book.cover && (
                  <img
                    src={book.cover}
                    alt={`Cover of ${book.title}`}
                    className="mb-4 h-48 w-full object-cover"
                  />
                )}
                <h3 className="text-lg font-semibold">{book.title}</h3>
                <p className="text-sm text-gray-600">Author: {book.author}</p>
              </div>
            ))
          ) : (
            <p>No results found. Try a different search term.</p>
          )}
        </div>
      )}

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
};

const BookDetailsModal = ({ book, onClose }) => {
  const [selectedTab, setSelectedTab] = useState("about");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const fetchTabData = async (tab) => {
    if (tab === "about") return; // No need to fetch data for "about"

    setLoading(true);
    const prompts = {
      conversation: `Please provide an insightful conversation from the book titled "${book.title}" by ${book.author}.`,
      quotes: `List 2 impactful quotes from the book titled "${book.title}" by ${book.author}.`,
      relatedBooks: `Recommend 2 books related to "${book.title}" by ${book.author}.`,
      critique: `Provide a critique for the book titled "${book.title}" by ${book.author}.`,
    };

    const query = `
      query GenerateText($instruction: String!, $prompt: String!) {
        generateText(instruction: $instruction, prompt: $prompt)
      }
    `;

    try {
      const result = await fetchGraphQL(query, {
        instruction: "You are a literary assistant. Display results concisely.",
        prompt: prompts[tab],
      });

      setContent(result?.generateText || "No content available.");
    } catch (error) {
      console.error("Error fetching data for tab:", error);
      setContent("Error fetching content.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    if (tab !== "about") {
      fetchTabData(tab);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-end p-6 space-x-4">
          <img
            src={book.cover || "/placeholder.jpg"}
            alt={book.title}
            className="h-48 w-32 rounded-lg object-cover"
          />
          <div>
            <h3 className="text-2xl font-semibold">{book.title}</h3>
            <p className="text-gray-600">{book.author}</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {["about", "conversation", "quotes", "relatedBooks", "critique"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-3 text-center ${
                selectedTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
              }`}
              onClick={() => handleTabChange(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 h-64 overflow-y-auto">
          {selectedTab === "about" ? (
            <p>{book.about}</p>
          ) : loading ? (
            <p>Loading...</p>
          ) : (
            <p>{content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenLibrary;
