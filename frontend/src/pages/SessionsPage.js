// src/pages/SessionsPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('http://localhost:5001/sessions');
        setSessions(response.data.sessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    fetchSessions();
  }, []);

  return (
    <div>
      <h1>Your Recording Sessions</h1>
      <ul className="sessions-list">
        {sessions.map(session => (
          <li key={session.id}>
            <Link to={`/session/${session.id}`}>
              Session #{session.id} started at {new Date(session.start_time).toLocaleString()}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SessionsPage;
