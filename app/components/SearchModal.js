"use client";

import { useState } from "react";
import Image from "next/image";
import { fetchGraphQL } from "../components/graphqlApi"; // Adjust the path as per your project structure

const SearchModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSearchBooks = async (query) => {
    try {
      const graphqlQuery = `
        query SearchBooks($query: String!) {
          searchBooks(query: $query) {
            collection
            status
            error
            searchMethod
            objects {
              namespace
              key
              text
              labels
              distance
              score
            }
          }
        }
      `;

      const data = await fetchGraphQL(graphqlQuery, { query });
      const searchResults = data?.searchBooks;

      if (searchResults?.status !== "success") {
        throw new Error(searchResults?.error || "Unknown error");
      }

      return searchResults.objects.map((obj) => ({
        key: obj.key,
        title: obj.labels?.[0] || "Unknown Title",
        author: obj.labels?.[1] || "Unknown Author",
        cover: obj.labels?.[2] || null,
        description: obj.text || "No description available.",
        score: obj.score || 0,
        distance: obj.distance || 0,
      }));
    } catch (error) {
      console.error("Error fetching search results:", error);
      throw error;
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError("");
    setSearchResults([]);

    try {
      const results = await fetchSearchBooks(searchTerm);
      setSearchResults(results);
    } catch (err) {
      setError("Failed to fetch search results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-6 border-b">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Find Catalogue Books using Natural Language
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter search term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border rounded-lg text-lg"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchResults.length > 0 ? (
            <div className="grid gap-4">
              {searchResults.map((result) => (
                <div
                  key={result.key}
                  className="flex gap-4 border rounded-lg p-4 shadow hover:shadow-lg transition-shadow"
                >
                  {/* Cover Image */}
                  {result.cover && (
                    <Image
                      src={result.cover}
                      alt={result.title}
                      height={320}
                      width={240}
                      className="w-24 h-32 object-cover rounded"
                    />
                  )}

                  {/* Book Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {result.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Author: {result.author}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {result.description}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Relevance Score: {result.score.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isLoading && (
              <p className="text-gray-500 text-center">
                No results found. Try a different search term.
              </p>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default SearchModal;
