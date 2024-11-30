import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Modal from "./Modal"; 
import { fetchGraphQL } from "./graphqlApi";

const StudentPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 6;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStudent, setNewStudent] = useState({
    name: "",
    roll: "",
    class: "",
    section: "",
    issuedBooks: [],
    issuedHistory: [],
  });

  // Open Modal to Add New Student
  const openModal = () => {
    setIsModalOpen(true);
    setNewStudent({
      name: "",
      roll: "",
      class: "",
      section: "",
      issuedBooks: [],
      issuedHistory: [],
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openDetailsModal = (student) => {
    setSelectedStudent(student);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedStudent(null);
  };

  useEffect(() => {
    const channel = supabase
      .channel("students")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Students" }, (payload) => {
        console.log("New student added:", payload);
        // Fetch students again when a new student is inserted
        fetchStudents(currentPage, searchQuery);
      })
      .subscribe();
  
    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [currentPage, searchQuery]);
  

  const fetchStudents = async (page, query = "") => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
  
    try {
      let queryBuilder = supabase
        .from("Students")
        .select("id, name, roll, class, section, issuedBooks, issuedHistory", { count: "exact" });
  
      if (query) {
        queryBuilder = queryBuilder.ilike("name", `%${query}%`);
      }
  
      const { count: totalCount, error: countError } = await queryBuilder;
  
      if (countError) {
        console.error("Error fetching total count:", countError.message);
        return;
      }
  
      setTotalPages(Math.ceil(totalCount / pageSize));
  
      const adjustedTo = Math.min(to, totalCount - 1);
  
      queryBuilder = supabase
        .from("Students")
        .select("id, name, roll, class, section, issuedBooks, issuedHistory")
        .range(from, adjustedTo);
  
      if (query) {
        queryBuilder.ilike("name", `%${query}%`);
      }
  
      const { data, error } = await queryBuilder;
  
      if (error) {
        console.error("Error fetching students:", error.message);
      } else {
        setStudents(data || []);
      }
    } catch (err) {
      console.error("Error during fetch:", err);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchStudents(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleAddStudent = async () => {
    const addStudentQuery = `
      mutation AddStudentToSupabase($name: String!, $roll: String!, $className: String!, $section: String!) {
        addStudentToSupabase(name: $name, roll: $roll, className: $className, section: $section)
      }
    `;

    await fetchGraphQL(addStudentQuery, {
      name: newStudent.name,
      roll: newStudent.roll,
      className: newStudent.class,
      section: newStudent.section,
    });
    fetchStudents(currentPage, searchQuery); // Refetch after adding
    closeModal();
  };
  

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    const deleteStudentQuery = `
      mutation DeleteStudentFromSupabase($studentId: Int!) {
        deleteStudentFromSupabase(studentId: $studentId)
      }
    `;
    await fetchGraphQL(deleteStudentQuery, { studentId: selectedStudent.id });
    fetchStudents(currentPage, searchQuery); // Refetch after deletion
    closeDetailsModal();
  };
  
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold">Students</h1>

        <button
          onClick={openModal}
          className="w-10 h-10 bg-black text-white rounded-full hover:bg-gray-800 flex items-center justify-center"
        >
          +
        </button>
      </div>

      {/* Modal to Add New Student */}
      <Modal isOpen={isModalOpen} closeModal={closeModal}>
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Add New Student</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Name"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              className="w-full p-2 border rounded-lg shadow-md"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Roll Number"
              value={newStudent.roll}
              onChange={(e) => setNewStudent({ ...newStudent, roll: e.target.value })}
              className="w-full p-2 border rounded-lg shadow-md"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Class"
              value={newStudent.class}
              onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
              className="w-full p-2 border rounded-lg shadow-md"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Section"
              value={newStudent.section}
              onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
              className="w-full p-2 border rounded-lg shadow-md"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAddStudent}
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              Add Student
            </button>
          </div>
        </div>
      </Modal>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search Student..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full p-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {students.length > 0 ? (
        <table className="w-full bg-white rounded-lg shadow-md text-left">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b font-semibold">Name</th>
              <th className="px-4 py-2 border-b font-semibold">Class</th>
              <th className="px-4 py-2 border-b font-semibold">Section</th>
              <th className="px-4 py-2 border-b font-semibold">Roll</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                onClick={() => openDetailsModal(student)}
                className="cursor-pointer hover:bg-gray-100 transition duration-150"
              >
                <td className="px-4 py-2 border-b">{student.name}</td>
                <td className="px-4 py-2 border-b">{student.class}</td>
                <td className="px-4 py-2 border-b">{student.section || "N/A"}</td>
                <td className="px-4 py-2 border-b">{student.roll || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No students found</p>
      )}

      {/* Pagination */}
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

      {/* Student Details Modal */}
      <Modal isOpen={isDetailsModalOpen} closeModal={closeDetailsModal}>
        {selectedStudent && (
          <div className="p-6">
            <h2 className="text-2xl font-semibold">{selectedStudent.name}</h2>
            <p><strong>Class:</strong> {selectedStudent.class}</p>
            <p><strong>Section:</strong> {selectedStudent.section || "N/A"}</p>
            <p><strong>Roll:</strong> {selectedStudent.roll || "N/A"}</p>

            <div className="mt-4">
              <h3 className="font-semibold">Issued Books:</h3>
              <ul>
                {selectedStudent.issuedBooks && selectedStudent.issuedBooks.length > 0 ? (
                  selectedStudent.issuedBooks.map((book, index) => <li key={index}>{book}</li>)
                ) : (
                  <p>No books issued</p>
                )}
              </ul>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold">Issued History:</h3>
              <ul>
                {selectedStudent.issuedHistory && selectedStudent.issuedHistory.length > 0 ? (
                  selectedStudent.issuedHistory.map((history, index) => (
                    <li key={index}>{history}</li>
                  ))
                ) : (
                  <p>No history available</p>
                )}
              </ul>
            </div>
            <div className="flex justify-end mt-4">
            <button onClick={handleDeleteStudent} className="delete-button text-red-400">
              Delete
            </button></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentPage;
