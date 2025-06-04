import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import "../styles/chat.css";
import { useNavigate } from "react-router-dom";

function Chat({ currentUser, onClose, recipientId }) {
  const { recipientId: recipientIdFromUrl } = useParams();
  const currentRecipientId = recipientId || recipientIdFromUrl;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [chatId, setChatId] = useState(null);
  const navigate = useNavigate();
  const [recipientFirebaseUid, setRecipientFirebaseUid] = useState(null);

  console.log("Chat component - currentUser:", currentUser);

  // Function to generate a unique chat ID between two users using Firebase UIDs
  const generateChatId = (uid1, uid2) => {
    if (!uid1 || !uid2) return null;
    const sortedUids = [uid1, uid2].sort();
    return `${sortedUids[0]}_${sortedUids[1]}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      console.error("Error formatting timestamp:", err);
      return "";
    }
  };

  // Fetch recipient's name and Firebase UID
  useEffect(() => {
    const fetchRecipientData = async () => {
      if (!currentRecipientId) {
        setIsLoading(false);
        setError("No recipient ID provided.");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/users/${currentRecipientId}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched recipient data:", data);
        setRecipientName(data.name || "Unknown User");
        if (data.firebaseUid) {
          setRecipientFirebaseUid(data.firebaseUid);
          console.log("Using recipient firebaseUid:", data.firebaseUid);
        } else {
          console.error(
            "Recipient Firebase UID not found in backend response."
          );
          setError("Recipient data incomplete.");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching recipient data:", error);
        setRecipientName("Unknown User");
        setError("Failed to load recipient information");
        setIsLoading(false);
      }
    };

    if (currentRecipientId) {
      fetchRecipientData();
    } else {
      setIsLoading(false);
      setError("No recipient specified for chat.");
    }
  }, [currentRecipientId]);

  // Initialize or get chat document and set up message listener
  useEffect(() => {
    if (!currentUser?.uid || !recipientFirebaseUid) {
      if (isLoading) return;
      setIsLoading(false);
      return;
    }

    const id = generateChatId(currentUser.uid, recipientFirebaseUid);
    if (!id) {
      setError("Invalid chat ID generated");
      setIsLoading(false);
      return;
    }

    setChatId(id);
    setError(null);

    const initializeChat = async () => {
      try {
        const chatRef = doc(db, "chats", id);
        await setDoc(
          chatRef,
          {
            participants: [currentUser.uid, recipientFirebaseUid],
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error initializing chat:", error);
        setError("Failed to initialize chat document");
        setIsLoading(false);
      }
    };

    initializeChat();

    try {
      const messagesCollectionRef = collection(db, "chats", id, "messages");
      const q = query(messagesCollectionRef, orderBy("createdAt", "asc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(messagesData);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error listening to messages:", error);
          setError("Failed to load messages");
          setIsLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up message listener:", error);
      setError("Failed to initialize chat listener");
      setIsLoading(false);
    }
  }, [currentUser?.uid, recipientFirebaseUid]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (!isLoading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      !currentUser?.uid ||
      !chatId ||
      !recipientFirebaseUid
    )
      return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      const messagesCollectionRef = collection(db, "chats", chatId, "messages");
      const chatRef = doc(db, "chats", chatId);

      await addDoc(messagesCollectionRef, {
        text: messageText,
        createdAt: serverTimestamp(),
        senderId: currentUser.uid,
        senderName: currentUser.name || "Unknown User",
        recipientId: recipientFirebaseUid,
      });

      await setDoc(
        chatRef,
        {
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      setError(null);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
      setNewMessage(messageText);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  if (!currentUser) {
    return <div className="chat-error">Please log in to chat.</div>;
  }

  if (isLoading && !recipientFirebaseUid) {
    return <div className="chat-loading">Loading recipient data...</div>;
  }

  if (
    error &&
    (error.includes("Failed to load recipient information") ||
      error.includes("No recipient ID provided.") ||
      error.includes("Invalid chat ID generated"))
  ) {
    return <div className="chat-error-message">{error}</div>;
  }

  if (!recipientFirebaseUid && !isLoading && !error) {
    return (
      <div className="chat-error">
        Recipient data not loaded. Cannot start chat.
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={handleBack} className="back-button">
          ← Back
        </button>
        <h2>Chat with {recipientName}</h2>
      </div>
      {error && !error.includes("recipient") && (
        <div className="chat-error-message">{error}</div>
      )}
      <div className="messages-list">
        {isLoading ? (
          <div className="chat-loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const senderId = message?.senderId;
            const currentUserId = currentUser?.uid;

            let messageClass = "message";
            if (senderId && currentUserId) {
              if (senderId === currentUserId) {
                messageClass += " sent";
              } else {
                messageClass += " received";
              }
            } else {
              messageClass += " unknown-sender";
            }

            return (
              <div key={message.id} className={messageClass}>
                <div className="message-sender">
                  {message.senderName || "Unknown User"}
                </div>
                <div className="message-content">{message.text}</div>
                <div className="message-timestamp">
                  {formatTimestamp(message.createdAt)}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="input-area">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={!!error || !recipientFirebaseUid}
        />
        <button
          type="submit"
          disabled={!!error || !newMessage.trim() || !recipientFirebaseUid}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
