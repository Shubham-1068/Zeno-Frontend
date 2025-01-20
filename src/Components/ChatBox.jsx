import React, { useState, useEffect, useRef } from "react";
import { Send, MessagesSquare } from "lucide-react";
import io from "socket.io-client";

const Chat = ({ username }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.current = io("https://zeno-backend-ptat.onrender.com");
    socket.current.on("allmessages", (message) => {
      setMessages(...messages, message);
      console.log(message);
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage) {
      setMessages([
        ...messages,
        { sender: username || "You", content: inputMessage },
      ]);
      socket.current.emit("message", {
        sender: username || "You",
        content: inputMessage,
      });
      setInputMessage("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 bg-[#01AAC1] flex items-center justify-center gap-2 cursor-default">
        <MessagesSquare className="text-white" size={22} />
        <h2 className="text-lg font-semibold text-white text-center">Chat</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === (username || "You")
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.sender === (username || "You")
                  ? "bg-[#01AAC1] text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              <p className={`text-sm font-semibold ${message.sender === (username || "You")
                  ? "text-end":"text-start"}`}>
                {message.sender === (username || "You")
                  ? "You"
                  : message.sender}
              </p>
              <p className="text-[16px]">{message.content}</p>
            </div>
          </div>
        ))}
        {/* This is the scroll target */}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t-2 border-gray-300">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full bg-gray-200 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-[#01AAC1]"
          />
          <button
            type="submit"
            className="p-2 rounded-full bg-[#01AAC1] text-white hover:bg-opacity-90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
