import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://slackconnect.onrender.com';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/status`).then(response => {
      if (response.data.connected) {
        navigate('/dashboard');
      } else {
        setIsLoading(false);
      }
    }).catch(() => setIsLoading(false));
  }, [navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
        Welcome
      </h2>
      <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
        Connect your Slack workspace to begin.
      </p>
      <a href={`${API_URL}/api/auth/slack`} style={{ display: 'inline-block' }}>
        <img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" />
      </a>
    </div>
  );
};

export default Home;