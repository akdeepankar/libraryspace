import { fetchGraphQL } from "../components/graphqlApi"; // Adjust the path as necessary

import { useState, useEffect, useRef } from "react";

const ChatbotIcon = ({ book }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [responses, setResponses] = useState([]); // Keep track of full conversation including "System:"
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null); // Reference to scroll to the bottom

  // Toggle the modal visibility
  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Handle user input and send message to Gemini
  const handleSendMessage = async () => {
    if (userMessage.trim()) {
      // Add user message to conversation history (displayed and full history)
      setResponses((prev) => [...prev, { sender: "user", message: userMessage }]);
      setIsLoading(true);

      // Fetch Gemini AI response using GraphQL
      const botResponse = await fetchGeminiResponse(userMessage);

      // Add bot's response to conversation history (including "System:")
      setResponses((prev) => [
        ...prev,
        { sender: "system", message: botResponse || "I couldn't understand that. Could you try rephrasing?" },
      ]);

      setIsLoading(false);
      setUserMessage(""); // Clear input field
    }
  };

  // Fetching response using GraphQL query
  const fetchGeminiResponse = async (message) => {
    const conversationHistory = responses
      .map((response) => `${response.sender === "user" ? "User" : "System"}: ${response.message}`)
      .join("\n");

    const graphqlQuery = `
      query GenerateText($instruction: String!, $prompt: String!) {
        generateText(instruction: $instruction, prompt: $prompt)
      }
    `;

    const variables = {
      instruction: `You are the author of the book titled "${book.title}" by ${book.author}. 
      Keep your responses short, no more than 1 or 2 sentences. Only provide more detail when absolutely necessary. 
      Respond based on the user's input, keeping it concise and relevant to the query. 
      The conversation history is provided use it to remember whatever is necessary. Be in an interesting flow. ${conversationHistory}`,
      prompt: `${message}`,
    };

    try {
      const data = await fetchGraphQL(graphqlQuery, variables);
      let generatedText = data?.generateText || "No response available.";

      // Limit response to one paragraph (max 500 characters for example)
      return truncateResponse(generatedText, 500);
    } catch (error) {
      console.error("Error fetching Gemini response:", error);
      return "Oops! Something went wrong.";
    }
  };

  // Function to truncate response to one paragraph (max 500 characters)
  const truncateResponse = (response, maxLength) => {
    if (response.length > maxLength) {
      return response.substring(0, maxLength) + "...";
    }
    return response;
  };

  // Scroll to the bottom of the chat whenever a new message is added
  useEffect(() => {
    // Scroll only when new responses are added
    if (responses.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [responses]);

  // Clean up "System:" and "User:" from the displayed message before rendering
  const cleanMessage = (message, sender) => {
    // Optionally, you can add further cleanup here if needed, but this removes labels
    return message.replace(/^(User|System):\s*/, "").trim();
  };

  // Initial greeting when modal opens
  useEffect(() => {
    if (isModalOpen && responses.length === 0) {
      // Send a greeting when the modal is first opened
      const greetingMessage = "Hello! How can I assist you with the book today?";
      setResponses([
        { sender: "system", message: greetingMessage }
      ]);
    }
  }, [isModalOpen, responses]);

  return (
    <div className="relative flex items-center">
      {/* Button to open the modal */}
      <button
        className="p-2 mt-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl focus:outline-none transform transition duration-300 hover:scale-105"
        title="Talk to the Book"
        onClick={handleModalToggle}
      >
        Talk 💬
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed m-5 inset-0 z-50 flex justify-end bg-black bg-opacity-5">
          <div
            className="bg-gradient-to-r from-blue-100 to-purple-300 w-full md:w-1/3 h-full flex flex-col shadow-lg rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{book.title}</h3>
                <p className="text-md text-gray-600 italic">by {book.author}</p>
              </div>
              <button
                className="text-black hover:text-red-600 text-2xl focus:outline-none"
                onClick={handleModalToggle}
              >
                ×
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {responses.map((response, index) => (
                <div
                  key={index}
                  className={`flex ${response.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      response.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    } shadow`}
                  >
                    {cleanMessage(response.message, response.sender)}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="text-gray-400 text-sm animate-pulse">Typing...</div>
              )}
            </div>

            {/* Input Field */}
            <div className="px-6 py-4 border-t bg-white">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="Ask something about the book..."
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg focus:outline-none transform transition duration-300 hover:scale-105"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll reference */}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatbotIcon;
