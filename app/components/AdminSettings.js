import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminSettings() {
  const [userDetails, setUserDetails] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching user session:", error.message);
      } else if (session) {
        setUserDetails(session.user);
      }
    };

    fetchUserDetails();
  }, []);

  const handleDeleteAccount = async () => {
    const confirmation = confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmation) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase.auth.admin.deleteUser(userDetails.id);
      if (error) throw error;

      alert("Account deleted successfully.");
      router.push("/"); // Redirect to login or home after deletion
    } catch (error) {
      console.error("Error deleting account:", error.message);
      alert("An error occurred while deleting the account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!userDetails) {
    return (
      <div className="text-center">
        <p>Loading user details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Admin Settings</h2>
      <div className="mb-4">
        <h3 className="text-xl font-medium">User Details</h3>
        <p className="text-gray-600"><strong>Email:</strong> {userDetails.email}</p>
        <p className="text-gray-600"><strong>UUID:</strong> {userDetails.id}</p>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          Last signed in at:{" "}
          {new Date(userDetails.last_sign_in_at).toLocaleString()}
        </p>
      </div>

      {/* Delete Account Button */}
      <div className="mt-6">
        <button
          onClick={handleDeleteAccount}
          className={`px-4 py-2 text-white font-semibold rounded-lg ${
            isDeleting ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-700"
          }`}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
