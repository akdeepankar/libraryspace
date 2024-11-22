import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AddBookForm from "./addBookForm";
import Modal from "./Modal";

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 8;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isBookDetailsModalOpen, setIsBookDetailsModalOpen] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openStudentModal = (book) => {
    setSelectedBook(book);
    setIsStudentModalOpen(true);
  };
  const closeStudentModal = () => setIsStudentModalOpen(false);

  const openBookDetailsModal = (book) => {
    setSelectedBook(book);
    setIsBookDetailsModalOpen(true);
  };
  const closeBookDetailsModal = () => setIsBookDetailsModalOpen(false);



  const fetchBooks = async (page, query = "") => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    let totalCount = 0;

    try {
      let queryBuilder = supabase
        .from("Books")
        .select("id, title, author, category, status, issuedTo, about", { count: "exact" }); // Fetch "about" field

      if (query) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,author.ilike.%${query}%,category.ilike.%${query}%`
        );
      }

      const { count, error: countError } = await queryBuilder;

      if (countError) {
        console.error("Error fetching total count:", countError.message);
        return;
      }

      totalCount = count;
      setTotalPages(Math.ceil(totalCount / pageSize));
      const to = Math.min(from + pageSize - 1, totalCount - 1);

      queryBuilder = supabase
        .from("Books")
        .select("id, title, author, category, status, issuedTo, about") // Fetch "about" field
        .range(from, to);

      if (query) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,author.ilike.%${query}%,category.ilike.%${query}%`
        );
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error("Error fetching books:", error.message);
      } else {
        setBooks(data || []);
      }
    } catch (err) {
      console.error("Error during fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (search = "") => {
    try {
      let queryBuilder = supabase.from("Students").select("id, name, issuedBooks, issuedHistory");
      if (search) queryBuilder = queryBuilder.ilike("name", `%${search}%`);
      const { data, error } = await queryBuilder;
      if (error) console.error("Error fetching students:", error.message);
      else setStudents(data || []);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const issueBookToStudent = async (student) => {
    if (!selectedBook) return;
  
    try {
      // Save student's name in the issuedTo field of the Books table
      const { error: bookError } = await supabase
        .from("Books")
        .update({ status: "issued", issuedTo: student.name }) // Save student name
        .eq("id", selectedBook.id);
  
      if (bookError) {
        console.error("Error issuing book:", bookError.message);
        return;
      }
  
      // Add book title to the student's issuedBooks
      const updatedIssuedBooks = [...(student.issuedBooks || []), selectedBook.title];
      const { error: studentError } = await supabase
        .from("Students")
        .update({ issuedBooks: updatedIssuedBooks })
        .eq("id", student.id);
  
      if (studentError) {
        console.error("Error updating student's issued books:", studentError.message);
        return;
      }
  
      // Record the book issue in the Issued table with the current date and time
      const issueDate = new Date().toISOString();
      const { error: issueError } = await supabase
        .from("Issued")
        .insert([
          {
            studentName: student.name,
            bookTitle: selectedBook.title,
            author: selectedBook.author,
            issueDate,
          },
        ]);
  
      if (issueError) {
        console.error("Error adding to Issued table:", issueError.message);
        return;
      }
  
      // Update local state
      setBooks((prevBooks) =>
        prevBooks.map((book) =>
          book.id === selectedBook.id ? { ...book, status: "issued" } : book
        )
      );
  
      closeStudentModal();
  
    } catch (err) {
      console.error("Error issuing book:", err);
    }
  };
  
  
  const returnBook = async (book) => {
    // Ensure there's an issued student to handle the return
    if (!book.issuedTo) return;
  
    try {
      // Fetch the student data based on the issuedTo field (student name or ID)
      const { data: student, error: fetchStudentError } = await supabase
        .from("Students")
        .select("id, name, issuedBooks, issuedHistory")
        .eq("name", book.issuedTo)  // Match by student's name (or use ID if that's what is stored)
        .single();
  
      if (fetchStudentError) {
        console.error("Error fetching student data:", fetchStudentError.message);
        return;
      }
  
      // Remove the book title from the student's issuedBooks array
      const updatedIssuedBooks = student.issuedBooks.filter(
        (title) => title !== book.title
      );
  
      // Update issuedHistory to include the returned book title
      const updatedIssuedHistory = [...(student.issuedHistory || []), book.title];
  
      // Update the student's issuedBooks and issuedHistory arrays
      const { error: updateStudentError } = await supabase
        .from("Students")
        .update({
          issuedBooks: updatedIssuedBooks,
          issuedHistory: updatedIssuedHistory,
        })
        .eq("id", student.id);
  
      if (updateStudentError) {
        console.error("Error updating student's issued books and history:", updateStudentError.message);
        return;
      }
  
      // Update the book's status to "available" and clear the issuedTo field
      const { error: bookUpdateError } = await supabase
        .from("Books")
        .update({
          status: "available",  // Set book status to available
          issuedTo: null,       // Clear the issuedTo field
        })
        .eq("id", book.id);
  
      if (bookUpdateError) {
        console.error("Error updating book status:", bookUpdateError.message);
        return;
      }
  
      // Record the return date in the Issued table for this specific book and student
      const returnDate = new Date().toISOString();
      const { error: returnDateError } = await supabase
        .from("Issued")
        .update({ returnDate })
        .match({ bookTitle: book.title, studentName: book.issuedTo });
  
      if (returnDateError) {
        console.error("Error updating return date in Issued table:", returnDateError.message);
        return;
      }
  
      // Update the local state for books to reflect the returned status
      setBooks((prevBooks) =>
        prevBooks.map((b) =>
          b.id === book.id
            ? { ...b, status: "available", issuedTo: null }
            : b
        )
      );
  
      // Optionally, update the students state if needed
      setStudents((prevStudents) =>
        prevStudents.map((s) =>
          s.id === student.id
            ? { ...s, issuedBooks: updatedIssuedBooks }
            : s
        )
      );
    } catch (err) {
      console.error("Error in returnBook function:", err);
    }
  };
  
  const deleteBook = async (title) => {
    try {
      // Sending the GraphQL mutation request to delete the book
      const response = await fetch("https://sample-ak-deepankar.hypermode.app/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjIxNjA5NzcsImlhdCI6MTczMDYyNDk3NywiaXNzIjoiaHlwZXJtb2RlLmNvbSIsInN1YiI6ImFway0wMTkyZjE0OS03YWZkLTc4NWYtYTFlNy1iMGJkNzVlN2JhZjYifQ.B_Ahoca6dahbPdFCeWY-c0fu63N2k_7CwyrK_8tAsYOKNgZFWbGK4sQtS66dLmdStq4XrhixeRm4J0EF4UEzEg", // Replace with your actual token
        },
        body: JSON.stringify({
          query: `
            mutation DeleteBookFromSupabase2($title: String!) {
              deleteBookFromSupabase2(title: $title)
            }
          `,
          variables: { title },
        }),
      });
  
      const result = await response.json();
  
      if (response.ok && result.data) {
        console.log("Book deleted successfully!");
  
        // Update the local state to remove the deleted book from the list
        setBooks((prevBooks) => prevBooks.filter((book) => book.title !== title));
  
        // Optionally, show a confirmation or success message
        alert("Book deleted successfully!");
      } else {
        console.error("Error deleting book:", result.errors);
        alert("Failed to delete the book.");
      }
    } catch (err) {
      console.error("Error in deleteBook function:", err);
      alert("An error occurred while deleting the book.");
    }
  };
  
  
  

  

  useEffect(() => {
    fetchBooks(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  useEffect(() => {
    if (isStudentModalOpen) fetchStudents(studentSearch);
  }, [isStudentModalOpen, studentSearch]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleSearchChange = (event) => setSearchQuery(event.target.value);
  const handleStudentSearchChange = (event) => setStudentSearch(event.target.value);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold">Books</h1>
        <button
          onClick={openModal}
          className="w-10 h-10 bg-black text-white rounded-full hover:bg-gray-800 flex items-center justify-center"
        >
          +
        </button>
      </div>

      <Modal isOpen={isModalOpen} closeModal={closeModal}>
        <AddBookForm closeModal={closeModal} />
      </Modal>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Title, Author, or Category..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full p-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {books.length > 0 ? (
        <table className="w-full bg-white rounded-lg shadow-md text-left">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b font-semibold">Title</th>
              <th className="px-4 py-2 border-b font-semibold">Author</th>
              <th className="px-4 py-2 border-b font-semibold">Category</th>
              <th className="px-4 py-2 border-b font-semibold">Status</th>
              <th className="px-4 py-2 border-b font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr
                key={book.id}
                onClick={() => openBookDetailsModal(book)}
                className="hover:bg-gray-100 transition duration-150 cursor-pointer"
              >
                <td className="px-4 py-2 border-b">{book.title}</td>
                <td className="px-4 py-2 border-b">{book.author}</td>
                <td className="px-4 py-2 border-b">{book.category || "N/A"}</td>
                <td className="px-4 py-2 border-b">{book.status || "N/A"}</td>
                <td className="px-4 py-2 border-b">
  {book.status === "issued" ? (
    <button
      onClick={(e) => {
        e.stopPropagation();
        returnBook(book);
      }}
      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
    >
      Return
    </button>
  ) : (
    <button
      onClick={(e) => {
        e.stopPropagation();
        openStudentModal(book);
      }}
      className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
    >
      Issue
    </button>
  )}
  <button
    onClick={(e) => {
      e.stopPropagation();
      deleteBook(book.title); // Call the deleteBook function
    }}
    className="bg-red-700 text-white px-2 py-1 rounded ml-2 hover:bg-red-800"
  >
    Delete
  </button>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No books found</p>
      )}

      <div className="pagination flex justify-center items-center mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 mx-2 bg-blue-600 text-white rounded-full disabled:bg-gray-400 disabled:text-gray-500 transition-all duration-300 hover:bg-blue-700"
        >
          &lt; Prev
        </button>

        <span className="px-4 py-2 text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 mx-2 bg-blue-600 text-white rounded-full disabled:bg-gray-400 disabled:text-gray-500 transition-all duration-300 hover:bg-blue-700"
        >
          Next &gt;
        </button>
      </div>

      {isBookDetailsModalOpen && selectedBook && (
        <Modal isOpen={isBookDetailsModalOpen} closeModal={closeBookDetailsModal}>
            <div>
            <h2 className="text-xl font-semibold">{selectedBook.title}</h2>
            <p><strong>Author:</strong> {selectedBook.author}</p>
            <p><strong>Category:</strong> {selectedBook.category}</p>
            <p><strong>Status:</strong> {selectedBook.status}</p>
            <p><strong>About:</strong> {selectedBook.about}</p>
            </div>
            <button onClick={closeBookDetailsModal} className="bg-gray-500 text-white px-4 py-2 rounded mt-4">Close</button>
        </Modal>
        )}


      <Modal isOpen={isStudentModalOpen} closeModal={closeStudentModal}>
        <h2 className="text-xl font-semibold mb-4">Select a Student</h2>
        <input
          type="text"
          placeholder="Search students..."
          value={studentSearch}
          onChange={handleStudentSearchChange}
          className="w-full p-2 mb-4 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <ul className="list-disc pl-5">
          {students.map((student) => (
            <li key={student.id} className="mb-2 flex justify-between">
              <span>{student.name}</span>
              <button
                onClick={() => issueBookToStudent(student)}
                className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              >
                Assign
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
};

export default BooksPage;
