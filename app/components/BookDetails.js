import Image from "next/image";
import { useState, useEffect } from "react";

const API_URL = 'https://sample-ak-deepankar.hypermode.app/graphql';
const API_KEY = "Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjIxNjA5NzcsImlhdCI6MTczMDYyNDk3NywiaXNzIjoiaHlwZXJtb2RlLmNvbSIsInN1YiI6ImFway0wMTkyZjE0OS03YWZkLTc4NWYtYTFlNy1iMGJkNzVlN2JhZjYifQ.B_Ahoca6dahbPdFCeWY-c0fu63N2k_7CwyrK_8tAsYOKNgZFWbGK4sQtS66dLmdStq4XrhixeRm4J0EF4UEzEg";

const BookDetailsModal = ({ book, onClose }) => {
  const [selectedTab, setSelectedTab] = useState("about");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [conversation, setConversation] = useState("");
  const [critique, setCritique] = useState("");

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const fetchTabData = async (tab) => {
    setLoading(true);
    const prompts = {
      conversation: `Please provide an insightful and engaging conversation from the book titled "${book.title}" by ${book.author} in a paragraph. Format the conversation in paragraphs with clear speakers, and separate each speaker's dialogue with a dash and speaker's name. Include at least three lines of dialogue.`,
      quotes: `List 2 impactful and memorable quotes from the book titled "${book.title}" by ${book.author}. Format each quote in a new line, along with the speaker's name or character if applicable. Provide the source of the quote in the format of "Book Title - Author Name."`,
      relatedBooks: `Recommend 2 books that are related to "${book.title}" by ${book.author}. Group the books by similarity in genre, theme, or author. Provide the title, author, and a brief description of each recommended book. Format the data as follows: Title - Author, Description.`,
      critique: `Provide a critique for the book titled "${book.title}" by ${book.author} in a paragraph. Include points on the plot, writing style, characters, and overall impact of the book. Make sure the critique is detailed and includes both positives and negatives.`,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: API_KEY,
        },
        body: JSON.stringify({
          query: `
            query GenerateText($instruction: String!, $prompt: String!) {
              generateText(instruction: $instruction, prompt: $prompt)
            }
          `,
          variables: {
            instruction: "You are an expert literary assistant. Display the results directly without any pre-sentence like 'Here is, Here are' etc.",
            prompt: prompts[tab],
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data: " + response.statusText);
      }

      const data = await response.json();
      const generatedText = data.data.generateText || "No content available.";

      switch (tab) {
        case "conversation":
          setConversation(generatedText);
          break;
        case "quotes":
          setQuotes(generatedText.split("\n"));
          break;
        case "relatedBooks":
          setRecommendedBooks(generatedText.split("\n"));
          break;
        case "critique":
          setCritique(generatedText);
          break;
        default:
          setContent(generatedText);
      }
    } catch (error) {
      setContent("Error fetching content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab !== "about") {
      fetchTabData(selectedTab);
    } else {
      setContent(book.about || "No information available for this book.");
    }
  }, [selectedTab, book.about]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"
      onClick={handleOverlayClick}
    >
      <div
        className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-end p-6 space-x-4">
          <Image
            src={book.cover || "/cover.gif"}
            alt={book.title}
            height={200}
            width={150}
            className="rounded-lg object-cover"
          />
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">{book.title}</h3>
            <p className="text-md text-gray-600">{book.author}</p>
            <div
              className={`mt-3 px-4 py-2 text-sm font-medium text-white rounded-lg ${
                book.status === "available" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {book.status || "Unavailable"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {["about", "conversation", "quotes", "relatedBooks", "critique"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-3 text-center text-sm font-medium ${
                selectedTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, " $1")}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 h-64 overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : selectedTab === "quotes" || selectedTab === "relatedBooks" ? (
            <ul className="space-y-3">
              {(selectedTab === "quotes" ? quotes : recommendedBooks).map(
                (item, index) =>
                  item.trim() && (
                    <li key={index} className="p-3 bg-gray-100 rounded-lg border">
                      {item}
                    </li>
                  )
              )}
            </ul>
          ) : (
            <p className="text-gray-800">
              {selectedTab === "about"
                ? content
                : selectedTab === "conversation"
                ? conversation
                : critique}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
