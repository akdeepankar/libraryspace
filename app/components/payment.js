"use client";
import { fetchGraphQL } from "./graphqlApi"; 
import { useState, useEffect } from "react";

export default function Payments() {
  const [paymentData, setPaymentData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const graphqlQuery = `
        query FetchCapturedPaymentLinks {
          fetchCapturedPaymentLinks
        }
      `;

      // Fetch data from GraphQL
      const response = await fetchGraphQL(graphqlQuery);

      // Extract and parse the JSON string from the response
      const rawData = response?.fetchCapturedPaymentLinks || "";
      const jsonString = rawData.split(": ", 2)[1]; // Extract the JSON part
      const parsedData = JSON.parse(jsonString); // Parse JSON

      // Set payment data to state
      setPaymentData(parsedData.payment_links || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch payments on initial render
    fetchPayments();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Payments</h1>
      <button
        onClick={fetchPayments}
        disabled={loading}
        className={`mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Refreshing..." : "Refresh Payments"}
      </button>
      <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="text-left py-2 px-4">Customer Name</th>
            <th className="text-left py-2 px-4">Email</th>
            <th className="text-left py-2 px-4">Amount</th>
            <th className="text-left py-2 px-4">Status</th>
            <th className="text-left py-2 px-4">Short URL</th>
          </tr>
        </thead>
        <tbody>
          {paymentData.length > 0 ? (
            paymentData.map((payment) => (
              <tr key={payment.id} className="border-t">
                <td className="py-2 px-4">
                  {payment.customer?.name || "N/A"}
                </td>
                <td className="py-2 px-4">
                  {payment.customer?.email || "N/A"}
                </td>
                <td className="py-2 px-4">{payment.amount} {payment.currency}</td>
                <td className="py-2 px-4">{payment.status}</td>
                <td className="py-2 px-4">
                  <a
                    href={payment.short_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Link
                  </a>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="5"
                className="text-center py-4 text-gray-500"
              >
                No payment records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
