import React, { useState } from "react";
import { fetchGraphQL } from "./graphqlApi";

const AddBookForm = ({ closeModal }) => {
  const [bookData, setBookData] = useState({
    title: "",
    author: "",
    isbn: "",
  });
  const [isAdding, setIsAdding] = useState(false); // State to manage loading

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookData((prev) => ({ ...prev, [name]: value }));
    console.log(`Updated ${name}:`, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting book data:", bookData);
    setIsAdding(true); // Start loading

    try {
      const graphqlQuery = `
        mutation AddBookToSupabase($title: String!, $author: String!, $isbn: String!) {
          addBookToSupabase(title: $title, author: $author, isbn: $isbn)
        }
      `;

      const variables = {
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
      };

      const result = await fetchGraphQL(graphqlQuery, variables);

      console.log("Response result:", result);

      if (result) {
        console.log("Book added successfully!");
        alert("Book added successfully!");
        if (closeModal) closeModal(); // Close the modal if the prop is provided
      } else {
        alert("Error adding book. Please try again.");
        console.error("Error adding book:", "Unknown error occurred");
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsAdding(false); // Stop loading
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Add a New Book</h2>
      {isAdding && <p className="text-blue-600 mb-2">Adding...</p>} {/* Adding message */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          value={bookData.title}
          onChange={handleChange}
          placeholder="Book Title"
          className="w-full p-2 border rounded-lg shadow-md"
          disabled={isAdding} // Disable inputs while loading
        />
        <input
          type="text"
          name="author"
          value={bookData.author}
          onChange={handleChange}
          placeholder="Author"
          className="w-full p-2 border rounded-lg shadow-md"
          disabled={isAdding} // Disable inputs while loading
        />
        <input
          type="text"
          name="isbn"
          value={bookData.isbn}
          onChange={handleChange}
          placeholder="ISBN"
          className="w-full p-2 border rounded-lg shadow-md"
          disabled={isAdding} // Disable inputs while loading
        />
        <button
          type="submit"
          className={`px-4 py-2 ${
            isAdding ? "bg-gray-400" : "bg-blue-600"
          } text-white rounded-full hover:bg-blue-700`}
          disabled={isAdding} // Disable button while loading
        >
          {isAdding ? "Adding..." : "Add Book"}
        </button>
      </form>
    </div>
  );
};

export default AddBookForm;
