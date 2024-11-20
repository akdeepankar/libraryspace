import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const IssuedRecords = () => {
  const [issuedRecords, setIssuedRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [monthFilter, setMonthFilter] = useState(""); // Filter by month
  const [bookTitleFilter, setBookTitleFilter] = useState(""); // Filter by book title
  const [studentNameFilter, setStudentNameFilter] = useState(""); // Filter by student name
  const [authorFilter, setAuthorFilter] = useState(""); // Filter by author

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Memoized function to fetch issued records
  const fetchIssuedRecords = useCallback(async () => {
    setLoading(true);

    try {
      // Build the query with filters
      let query = supabase.from("Issued").select("bookTitle, author, studentName, issueDate, returnDate");

      if (monthFilter) {
        const startDate = new Date();
        startDate.setMonth(monthFilter - 1); // Months are 0-based in JS
        startDate.setDate(1); // Start of the month

        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1); // Next month to get the whole range

        query = query.gte("issueDate", startDate.toISOString()).lt("issueDate", endDate.toISOString());
      }

      if (bookTitleFilter) query = query.ilike("bookTitle", `%${bookTitleFilter}%`);
      if (studentNameFilter) query = query.ilike("studentName", `%${studentNameFilter}%`);
      if (authorFilter) query = query.ilike("author", `%${authorFilter}%`);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching issued records:", error.message);
      } else {
        setIssuedRecords(data || []);
      }
    } catch (err) {
      console.error("Error during fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [monthFilter, bookTitleFilter, studentNameFilter, authorFilter]);

  // Fetch records when filters change
  useEffect(() => {
    fetchIssuedRecords();
  }, [fetchIssuedRecords]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-4">Issued Book Records</h1>

      {/* Filter Section */}
      <div className="mb-4">
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="p-2 border rounded-lg mr-4"
        >
          <option value="">All Months</option>
          {months.map((month, index) => (
            <option key={index} value={index + 1}>
              {month}
            </option>
          ))}
        </select>

        <label className="mr-4">Filter by Book Title:</label>
        <input
          type="text"
          placeholder="Book Title"
          value={bookTitleFilter}
          onChange={(e) => setBookTitleFilter(e.target.value)}
          className="p-2 border rounded-lg mr-4"
        />

        <label className="mr-4">Student Name:</label>
        <input
          type="text"
          placeholder="Student Name"
          value={studentNameFilter}
          onChange={(e) => setStudentNameFilter(e.target.value)}
          className="p-2 border rounded-lg mr-4"
        />

        <label className="mr-4">Author:</label>
        <input
          type="text"
          placeholder="Author"
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          className="p-2 border rounded-lg"
        />
      </div>

      {/* Loading State */}
      {loading && <p className="text-gray-500">Loading...</p>}

      {/* Display Table */}
      {issuedRecords.length > 0 ? (
        <table className="w-full bg-white rounded-lg shadow-md text-left">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b font-semibold">Book Title</th>
              <th className="px-4 py-2 border-b font-semibold">Author</th>
              <th className="px-4 py-2 border-b font-semibold">Student Name</th>
              <th className="px-4 py-2 border-b font-semibold">Issue Date</th>
              <th className="px-4 py-2 border-b font-semibold">Return Date</th>
            </tr>
          </thead>
          <tbody>
            {issuedRecords.map((record, index) => (
              <tr key={index} className="hover:bg-gray-100 transition duration-150">
                <td className="px-4 py-2 border-b">{record.bookTitle}</td>
                <td className="px-4 py-2 border-b">{record.author}</td>
                <td className="px-4 py-2 border-b">{record.studentName}</td>
                <td className="px-4 py-2 border-b">
                  {new Date(record.issueDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border-b">
                  {record.returnDate
                    ? new Date(record.returnDate).toLocaleDateString()
                    : "Not Returned"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No records found</p>
      )}
    </div>
  );
};

export default IssuedRecords;
