import Image from "next/image";
import { useState, useEffect } from "react";
import { fetchGraphQL } from "../components/graphqlApi"; // Adjust the path as necessary
import ChatbotIcon from "./chatbot";
import Markdown from 'react-markdown'

// Define icons for each tab
const TabIcons = {
  about: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 mr-2 mb-1 inline-block"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  conversation: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 mr-2 inline-block"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-6-6h6m-6 4h4m1-8V6a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2h3"
      />
    </svg>
  ),
  quotes: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 mr-2 inline-block"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2z"
      />
    </svg>
  ),
  relatedBooks: (
    <svg
  xmlns="http://www.w3.org/2000/svg"
  className="w-4 h-4 mr-2 inline-block"
  fill="none"
  viewBox="0 0 24 24"
  stroke="currentColor"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M12 8c2.5 0 4 1.5 4 3s-1.5 3-4 3-4-1.5-4-3 1.5-3 4-3zm-8 4V5a2 2 0 012-2h10a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m2-6h8m-8 4h6m-6 4h6"
  />
</svg>

  ),
  critique: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 mr-2 inline-block"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};


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
      conversation: `Use Markdown format. Please provide an insightful and engaging conversation from the book titled "${book.title}" by ${book.author} in a paragraph. Format the conversation in paragraphs with clear speakers, and separate each speaker's dialogue with a dash and speaker's name. Include at least three lines of dialogue.`,
      quotes: `Use Markdown format. List 2 impactful and memorable quotes from the book titled "${book.title}" by ${book.author}. Format each quote in a new line, along with the speaker's name or character if applicable. Provide the source of the quote in the format of "Book Title - Author Name."`,
      relatedBooks: `Use Markdown format. Recommend 2 books that are related to "${book.title}" by ${book.author}. Group the books by similarity in genre, theme, or author. Provide the title, author, and a brief description of each recommended book. Format the data as follows: Title - Author, Description.`,
      critique: `Use Markdown format. Provide a critique for the book titled "${book.title}" by ${book.author} in a paragraph. Include points on the plot, writing style, characters, and overall impact of the book. Make sure the critique is detailed and includes both positives and negatives.`,
    };

    const query = `
      query GenerateText($instruction: String!, $prompt: String!) {
        generateText(instruction: $instruction, prompt: $prompt)
      }
    `;

    try {
      const result = await fetchGraphQL(query, {
        instruction: "You are an expert literary assistant. Display the results directly without any pre-sentence like 'Here is, Here are' etc.",
        prompt: prompts[tab],
      });

      const generatedText = result?.generateText || "No content available.";

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
        <div className="flex items-end p-6 space-x-4 bg-gradient-to-r from-blue-200 to-purple-100">
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
            <ChatbotIcon book={book} />
            <div
              className={`mt-3 text-sm font-medium text-white rounded-lg ${
                book.status === "available" ? "text-blue-500" : "text-purple-500"
              }`}
            >
              {book.status || "OPEN INTERNET BOOK"}
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
              {TabIcons[tab]}
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
                 
                    <li key={index} className="p-3 bg-gray-100 rounded-lg border">
                      <Markdown>{item}</Markdown>
                    </li>
                  
              )}
            </ul>
          ) : (
            <div className="text-gray-800">
            <Markdown>
              {selectedTab === "about"
                ? content
                : selectedTab === "conversation"
                ? conversation
                : critique}
            </Markdown>
          </div>

          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
