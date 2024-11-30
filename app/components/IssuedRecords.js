import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchGraphQL } from "./graphqlApi";

const IssuedRecords = () => {
  const [issuedRecords, setIssuedRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [monthFilter, setMonthFilter] = useState(""); 
  const [bookTitleFilter, setBookTitleFilter] = useState("");
  const [studentNameFilter, setStudentNameFilter] = useState(""); 
  const [authorFilter, setAuthorFilter] = useState(""); 

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const fetchIssuedRecords = useCallback(async () => {
    setLoading(true);

    try {
      // Build the query with filters
      let query = supabase.from("Issued").select("bookTitle, author, studentName, email, issueDate, returnDate");

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

  const handleLateFeeLink = async (record) => {
    const confirmAction = window.confirm(
      `Send a late fee link to ${record.studentName} (${record.email})?`
    );
  
    if (!confirmAction) return;
  
    // GraphQL query
    const graphqlQuery = `
      query GeneratePaymentLink($description: String!, $customerName: String!, $customerEmail: String!) {
        generatePaymentLink(description: $description, customerName: $customerName, customerEmail: $customerEmail)
      }
    `;

    // Variables, if needed
    const variables = {
      description: `Late Fee Payment for ${record.bookTitle}`,
      customerName: `${record.studentName}`,    
      customerEmail: `${record.email}`,
    }; 
  
    try {
      const data = await fetchGraphQL(graphqlQuery, variables);
  
      const paymentLink = data?.generatePaymentLink || "No link available.";
      alert(`${paymentLink}`);
      console.log("Payment link:", paymentLink);
    } catch (error) {
      console.error("Error fetching payment link:", error);
      alert("Oops! Something went wrong.");
    }
  };
  

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
              <th className="px-4 py-2 border-b font-semibold">Email</th>
              <th className="px-4 py-2 border-b font-semibold">Issue Date</th>
              <th className="px-4 py-2 border-b font-semibold">Return Date</th>
              <th className="px-4 py-2 border-b font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {issuedRecords.map((record, index) => (
              <tr key={index} className="hover:bg-gray-100 transition duration-150">
                <td className="px-4 py-2 border-b">{record.bookTitle}</td>
                <td className="px-4 py-2 border-b">{record.author}</td>
                <td className="px-4 py-2 border-b">{record.studentName}</td>
                <td className="px-4 py-2 border-b">{record.email}</td>
                <td className="px-4 py-2 border-b">
                  {new Date(record.issueDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border-b">
                  {record.returnDate
                    ? new Date(record.returnDate).toLocaleDateString()
                    : "Not Returned"}
                </td>
                <td className="px-4 py-2 border-b">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    onClick={() => handleLateFeeLink(record)}
                  >
                    Late Fee Link
                  </button>
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