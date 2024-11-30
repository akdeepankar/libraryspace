"use client";

import { useState } from "react";
import { fetchGraphQL } from "../components/graphqlApi"; 
import BookDetailsModal from "./BookDetails";

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
      <div className="mb-6 mt-16">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for books..."
          className="border p-2 rounded-md w-full sm:w-64 bg-gray-200 focus:outline-none focus:ring focus:ring-blue-400"
        />
        <button
          onClick={fetchBooks}
          className="bg-gradient-to-r from-blue-400 to-blue-800 text-white px-4 py-2 rounded-md ml-2"
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
                className="p-4 border rounded-lg shadow-md bg-gradient-to-r from-blue-50 to-purple-100 cursor-pointer"
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


export default OpenLibrary;
