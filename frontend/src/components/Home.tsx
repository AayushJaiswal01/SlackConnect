import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://slackconnect.onrender.com';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already connected on page load
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
    <div>
      <h2>Welcome</h2>
      <p>Connect your Slack workspace to start sending messages.</p>
      <a href={`${API_URL}/api/auth/slack`}>
        <img 
          alt="Add to Slack" 
          height="40" 
          width="139" 
          src="https://platform.slack-edge.com/img/add_to_slack.png" 
          srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" 
        />
      </a>
    </div>
  );
};

export default Home;