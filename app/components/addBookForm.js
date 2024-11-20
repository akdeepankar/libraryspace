import React, { useState } from "react";

const AddBookForm = ({ closeModal }) => {
  const [bookData, setBookData] = useState({
    title: "",
    author: "",
    isbn: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookData((prev) => ({ ...prev, [name]: value }));
    console.log(`Updated ${name}:`, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting book data:", bookData);

    try {
      const response = await fetch('https://sample-ak-deepankar.hypermode.app/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjIxNjA5NzcsImlhdCI6MTczMDYyNDk3NywiaXNzIjoiaHlwZXJtb2RlLmNvbSIsInN1YiI6ImFway0wMTkyZjE0OS03YWZkLTc4NWYtYTFlNy1iMGJkNzVlN2JhZjYifQ.B_Ahoca6dahbPdFCeWY-c0fu63N2k_7CwyrK_8tAsYOKNgZFWbGK4sQtS66dLmdStq4XrhixeRm4J0EF4UEzEg'
        },
        body: JSON.stringify({
          query: `
          mutation AddBookToSupabase($title: String!, $author: String!, $isbn: String!) {
            addBookToSupabase(title: $title, author: $author, isbn: $isbn)
          }
        `,
          variables: {
            title: bookData.title,
            author: bookData.author,
            isbn: bookData.isbn,
          },
        }),
      });

      const result = await response.json();
      console.log("Response status:", response.status);
      console.log("Response result:", result);

      if (response.ok) {
        //toast.success("Book added successfully!");
        console.log("Book added successfully!");
        if (closeModal) closeModal(); // Close the modal if the prop is provided
      } else {
        //toast.error("Error adding book: " + (result.errors?.[0]?.message || "Unknown error"));
        console.error("Error adding book:", result.errors);
      }
    } catch (error) {
      console.error("Submission error:", error);
      //toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Add a New Book</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          value={bookData.title}
          onChange={handleChange}
          placeholder="Book Title"
          className="w-full p-2 border rounded-lg shadow-md"
        />
        <input
          type="text"
          name="author"
          value={bookData.author}
          onChange={handleChange}
          placeholder="Author"
          className="w-full p-2 border rounded-lg shadow-md"
        />
        <input
          type="text"
          name="isbn"
          value={bookData.isbn}
          onChange={handleChange}
          placeholder="ISBN"
          className="w-full p-2 border rounded-lg shadow-md"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
        >
          Add Book
        </button>
      </form>
    </div>
  );
};

export default AddBookForm;
