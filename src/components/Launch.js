// Launch.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/launch.css';

const techWords = [
  "React", "Node.js", "VS Code", "Android Studio", "Python", "Java",
  "MongoDB", "GitHub", "Kotlin", "Swift", "Docker", "Figma",
  "Firebase", "TensorFlow", "TypeScript", "Linux", "Xcode"
];

const Launch = () => {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % techWords.length);
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(wordInterval);
      navigate('/login');
    }, 3000);

    return () => {
      clearInterval(wordInterval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="launch-container">
      <h1 className="animated-word">{techWords[index]}</h1>
    </div>
  );
};

export default Launch;
