
import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://slackconnect.onrender.com';

interface SlackChannel {
  id: string;
  name: string;
}

interface ScheduledMessage {
  id: string;
  channelId: string;
  text: string;
  postAt: number;
}

const Dashboard: React.FC = () => {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledMessage[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      if (status !== 'ready') {
        setStatus('loading');
      }
      
      const [chanRes, schedRes] = await Promise.all([
        axios.get(`${API_URL}/api/channels`),
        axios.get(`${API_URL}/api/scheduled-messages`)
      ]);

      if (chanRes.data && chanRes.data.length > 0) {
        setChannels(chanRes.data);
        if (!selectedChannel) {
          setSelectedChannel(chanRes.data[0].id);
        }
      } else {
        setErrorMsg('Your bot is not in any public channels. Please add it to a channel to send messages.');
        setStatus('error');
        return;
      }
      
      setScheduled(schedRes.data);
      setStatus('ready');
    } catch (err) {
      setErrorMsg('Failed to fetch data. Your token might be invalid. Try reconnecting.');
      setStatus('error');
    }
  }, [selectedChannel, status]); 

  useEffect(() => {
    fetchData();
  }, []); 

  const handleSubmit = async (e: FormEvent, isScheduled: boolean) => {
    e.preventDefault();
    const endpoint = isScheduled ? 'schedule-message' : 'send-message';
    const payload = { channel: selectedChannel, text: message, post_at: isScheduled ? Math.floor(new Date(scheduleTime).getTime() / 1000) : undefined };
    
    try {
      await axios.post(`${API_URL}/api/${endpoint}`, payload);
      alert(`Message ${isScheduled ? 'scheduled' : 'sent'}!`);
      setMessage('');
      if (isScheduled) setScheduleTime('');
      fetchData(); 
    } catch (err: any) {
        const backendError = err.response?.data?.details || 'The bot may not be in that channel.';
        alert(`Failed to send message: ${backendError}`);
        console.error(err);
    }
  };

  const handleCancel = async (msg: ScheduledMessage) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled message?')) return;
    const originalScheduledMessages = [...scheduled];

   
    setScheduled(currentMessages => currentMessages.filter(m => m.id !== msg.id));
  
    try {
     await axios.delete(`${API_URL}/api/scheduled-messages/${msg.id}`, { data: { channelId: msg.channelId } });
        alert('Message canceled!');
        fetchData();
    } catch (err) {
        alert('Failed to cancel message.');
        //setScheduled(originalScheduledMessages); 
        console.error(err);
    }
  };

  if (status === 'loading') return <div>Loading dashboard, fetching channels...</div>;
  if (status === 'error') return <div style={{ color: 'red' }}>{errorMsg}</div>;

  return (
    <>
      <form>
        <h2>Message Composer</h2>
        <div style={{ marginBottom: 10 }}>
          <label>Channel: </label>
          <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          <textarea 
            value={message} 
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={5}
            style={{ width: '300px' }}
          />
        </div>
        <div>
          <button type="submit" onClick={(e) => handleSubmit(e, false)} disabled={!message || !selectedChannel}>Send Now</button>
        </div>
        <hr style={{ margin: '20px 0' }}/>
        <h3>Schedule for Later</h3>
        <div style={{ marginBottom: 10 }}>
            <input 
                type="datetime-local" 
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
            />
        </div>
        <div>
          <button type="submit" onClick={(e) => handleSubmit(e, true)} disabled={!message || !selectedChannel || !scheduleTime}>Schedule Message</button>
        </div>
      </form>

      <hr style={{ margin: '20px 0' }}/>

      <h2>Scheduled Messages</h2>
      {scheduled.length === 0 ? <p>No messages scheduled.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {scheduled.map(msg => (
            <li key={msg.id} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
              <p><strong>To:</strong> #{channels.find(c => c.id === msg.channelId)?.name || msg.channelId}</p>
              <p><strong>At:</strong> {new Date(msg.postAt * 1000).toLocaleString()}</p>
              <p><strong>Message:</strong> {msg.text}</p>
              <button onClick={() => handleCancel(msg)}>Cancel</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Dashboard;