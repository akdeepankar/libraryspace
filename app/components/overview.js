import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const Overview = () => {
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalIssuedBooks, setTotalIssuedBooks] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalAvailableBooks, setTotalAvailableBooks] = useState(0);
  const [issuedBooksByMonth, setIssuedBooksByMonth] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Generate list of recent years for the dropdown
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const fetchLibraryStats = async () => {
    try {
      // Fetch total book count
      const { count: totalBooksCount, error: totalBooksError } = await supabase
        .from("Books")
        .select("*", { count: "exact" });

      if (totalBooksError) throw totalBooksError;
      setTotalBooks(totalBooksCount);

      // Fetch total issued books
      const { data: issuedBooksData, error: issuedBooksError } = await supabase
        .from("Books")
        .select("issuedTo")
        .filter("issuedTo", "is", null);

      if (issuedBooksError) throw issuedBooksError;
      setTotalIssuedBooks(totalBooksCount - issuedBooksData.length);

      // Fetch total students
      const { count: totalStudentsCount, error: totalStudentsError } = await supabase
        .from("Students")
        .select("*", { count: "exact" });

      if (totalStudentsError) throw totalStudentsError;
      setTotalStudents(totalStudentsCount);

      // Calculate available books
      setTotalAvailableBooks(issuedBooksData.length);
    } catch (error) {
      console.error("Error fetching library stats:", error.message);
    }
  };

  const fetchIssuedBooksByMonth = async () => {
    try {
      const { data, error } = await supabase
        .from("Issued")
        .select("issueDate");

      if (error) throw error;

      const counts = new Array(12).fill(0); // Array to hold monthly counts

      data.forEach((record) => {
        const issueDate = new Date(record.issueDate);
        if (issueDate.getFullYear() === selectedYear) {
          const month = issueDate.getMonth();
          counts[month] += 1;
        }
      });

      setIssuedBooksByMonth(counts);
    } catch (error) {
      console.error("Error fetching issued books by month:", error.message);
    }
  };

  useEffect(() => {
    fetchLibraryStats();
    fetchIssuedBooksByMonth();
  }, [selectedYear]);

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  // Data for the bar chart
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Issued Books",
        data: issuedBooksByMonth,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Books Issued per Month - ${selectedYear}`,
        font: { size: 18 },
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-6">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold">Total Books</h2>
          <p className="text-3xl mt-2">{totalBooks}</p>
        </div>
        <div className="bg-green-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold">Total Issued Books</h2>
          <p className="text-3xl mt-2">{totalIssuedBooks}</p>
        </div>
        <div className="bg-yellow-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold">Total Students</h2>
          <p className="text-3xl mt-2">{totalStudents}</p>
        </div>
        <div className="bg-gray-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold">Available Books</h2>
          <p className="text-3xl mt-2">{totalAvailableBooks}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-4">
          <label htmlFor="yearFilter" className="mr-4 text-lg font-semibold">
            Filter by Year:
          </label>
          <select
            id="yearFilter"
            value={selectedYear}
            onChange={handleYearChange}
            className="p-2 border rounded-lg"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <Bar data={chartData} options={chartOptions} />

      </div>
    </div>
  );
};

export default Overview;
