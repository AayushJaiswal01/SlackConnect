
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
    try {
      // Construct the new URL with both IDs
      await axios.delete(`${API_URL}/api/scheduled-messages/${msg.channelId}/${msg.id}`);
      
      alert('Message canceled!');
      fetchData(); 
    } catch (err: any) {
      const backendError = err.response?.data?.details || 'An unknown error occurred.';
      alert(`Failed to cancel message: ${backendError}`);
      console.error(err);
    }
  }

  if (status === 'loading') return <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading dashboard, fetching channels...</div>;
  if (status === 'error') return <div style={{ textAlign: 'center', color: '#ef4444', fontWeight: 600, padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '6px' }}>{errorMsg}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Message Composer Section */}
      <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', margin: 0 }}>Message Composer</h2>
        
        <div>
          <label htmlFor="channel" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Channel</label>
          <select id="channel" value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
        </div>
        
        <div>
          <label htmlFor="message" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Message</label>
          <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..." rows={5} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flexGrow: 1 }}>
            <label htmlFor="scheduleTime" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Schedule Time (Optional)</label>
            <input id="scheduleTime" type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
          </div>
          <button type="submit" onClick={(e) => handleSubmit(e, true)} disabled={!message || !selectedChannel || !scheduleTime} style={{ backgroundColor: '#4f46e5', color: 'white', alignSelf: 'flex-end' }}>Schedule</button>
        </div>

        <button type="submit" onClick={(e) => handleSubmit(e, false)} disabled={!message || !selectedChannel} style={{ backgroundColor: '#1f2937', color: 'white', width: '100%' }}>Send Now</button>
      </form>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }}/>

      {/* Scheduled Messages Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', margin: 0 }}>Scheduled Messages</h2>
        
        {scheduled.length === 0 ? <p style={{ color: '#6b7280' }}>No messages scheduled.</p> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {scheduled.map(msg => (
              <li key={msg.id} style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>To: #{channels.find(c => c.id === msg.channelId)?.name || msg.channelId}</p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>At: {new Date(msg.postAt * 1000).toLocaleString()}</p>
                    <p style={{ marginTop: '0.75rem', color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
                  </div>
                  <button onClick={() => handleCancel(msg)} style={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.875rem', padding: '6px 12px', flexShrink: 0 }}>Cancel</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;