import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase-simple';
import './SupportPanel.css';

const SupportPanel = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Real-time tickets listener
  useEffect(() => {
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('status', 'in', ['open', 'in_progress']),
      orderBy('priority', 'asc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketList = [];
      snapshot.forEach((doc) => {
        ticketList.push({ id: doc.id, ...doc.data() });
      });
      setTickets(ticketList);
      setLoading(false);
      
      // Auto-select first high priority ticket
      if (ticketList.length > 0 && !selectedTicket) {
        const highPriorityTicket = ticketList.find(t => t.priority === 'high');
        setSelectedTicket(highPriorityTicket || ticketList[0]);
      }
    });

    return () => unsubscribe();
  }, [selectedTicket]);

  // Assign ticket to agent
  const assignTicket = async (ticketId) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        assignedAgent: 'current-agent', // In production, use actual agent ID
        assignedAt: Timestamp.now(),
        status: 'in_progress',
        updatedAt: Timestamp.now()
      });
      console.log('✅ Ticket assigned');
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  // Send chat message
  const sendMessage = async () => {
    if (!chatMessage.trim() || !selectedTicket) return;

    try {
      const newMessage = {
        id: `msg-${Date.now()}`,
        sender: 'support-agent',
        senderType: 'agent',
        message: chatMessage,
        timestamp: Timestamp.now(),
        attachments: []
      };

      // Add message to ticket
      const updatedMessages = [...(selectedTicket.messages || []), newMessage];
      
      await updateDoc(doc(db, 'tickets', selectedTicket.id), {
        messages: updatedMessages,
        updatedAt: Timestamp.now()
      });

      setChatMessage('');
      console.log('✅ Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Resolve ticket
  const resolveTicket = async (ticketId) => {
    const resolution = prompt('Enter resolution summary:');
    if (!resolution) return;

    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: 'resolved',
        resolution: resolution,
        resolvedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Clear selection if resolved ticket was selected
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
      
      console.log('✅ Ticket resolved');
    } catch (error) {
      console.error('Error resolving ticket:', error);
    }
  };

  // Escalate ticket
  const escalateTicket = async (ticketId) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        escalationLevel: 1,
        escalatedAt: Timestamp.now(),
        escalatedTo: 'supervisor',
        updatedAt: Timestamp.now()
      });
      console.log('⚡ Ticket escalated to supervisor');
    } catch (error) {
      console.error('Error escalating ticket:', error);
    }
  };

  // Emergency protocol
  const triggerEmergencyProtocol = async (ticketId) => {
    try {
      // Create emergency record
      const emergencyData = {
        id: `emergency-${Date.now()}`,
        type: 'support_escalation',
        severity: 'high',
        status: 'active',
        ticketId: ticketId,
        protocol: {
          coastGuardNotified: true,
          supervisorNotified: true,
          emergencyTeamDispatched: true
        },
        reportedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'emergencies'), emergencyData);
      
      await updateDoc(doc(db, 'tickets', ticketId), {
        escalationLevel: 3,
        escalatedTo: 'emergency-team',
        updatedAt: Timestamp.now()
      });

      alert('🚨 Emergency protocol activated! Emergency team notified.');
    } catch (error) {
      console.error('Error triggering emergency protocol:', error);
    }
  };

  if (loading) {
    return (
      <div className="support-loading">
        <div className="loading-spinner">🎧</div>
        <div>Loading Support Panel...</div>
      </div>
    );
  }

  return (
    <div className="support-panel">
      {/* Header */}
      <div className="support-header">
        <div className="support-logo">
          🎧 Customer Support Center
        </div>
        <div className="support-stats">
          <div className="stat-item">
            <div className="stat-value high">{tickets.length}</div>
            <div className="stat-label">Open Tickets</div>
          </div>
          <div className="stat-item">
            <div className="stat-value medium">{tickets.filter(t => t.priority === 'high').length}</div>
            <div className="stat-label">High Priority</div>
          </div>
          <div className="stat-item">
            <div className="stat-value good">2.3 min</div>
            <div className="stat-label">Avg Response</div>
          </div>
          <div className="stat-item">
            <div className="stat-value good">94%</div>
            <div className="stat-label">Satisfaction</div>
          </div>
        </div>
      </div>

      <div className="support-grid">
        {/* Ticket Queue */}
        <div className="panel queue-panel">
          <h3 className="panel-title">📋 Support Queue</h3>
          <div className="tickets-list">
            {tickets.map((ticket) => (
              <div 
                key={ticket.id}
                className={`ticket-item ${ticket.priority} ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="ticket-header">
                  <span className="ticket-id">#{ticket.id}</span>
                  <span className={`priority-badge priority-${ticket.priority}`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                </div>
                <div className="ticket-title">{ticket.title}</div>
                <div className="ticket-meta">
                  <span className="ticket-type">{ticket.type}</span>
                  <span className="ticket-time">
                    {ticket.createdAt?.toDate?.()?.toLocaleTimeString() || 'Recent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="panel details-panel">
          {selectedTicket ? (
            <>
              <h3 className="panel-title">🔍 Ticket Details - #{selectedTicket.id}</h3>
              <div className="ticket-details">
                <div className="detail-section">
                  <div className="detail-label">Title</div>
                  <div className="detail-value">{selectedTicket.title}</div>
                </div>
                
                <div className="detail-section">
                  <div className="detail-label">Description</div>
                  <div className="detail-value">{selectedTicket.description}</div>
                </div>
                
                <div className="detail-section">
                  <div className="detail-label">Priority & Type</div>
                  <div className="detail-value">
                    <span className={`priority-badge priority-${selectedTicket.priority}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                    <span className="type-badge">{selectedTicket.type}</span>
                  </div>
                </div>

                {selectedTicket.rideId && (
                  <div className="detail-section">
                    <div className="detail-label">Related Ride</div>
                    <div className="detail-value">
                      <button className="btn-link">#{selectedTicket.rideId}</button>
                    </div>
                  </div>
                )}

                <div className="ticket-actions">
                  {selectedTicket.status === 'open' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => assignTicket(selectedTicket.id)}
                    >
                      ✅ Assign to Me
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-success"
                    onClick={() => resolveTicket(selectedTicket.id)}
                  >
                    ✅ Resolve
                  </button>
                  
                  <button 
                    className="btn btn-warning"
                    onClick={() => escalateTicket(selectedTicket.id)}
                  >
                    ⚡ Escalate
                  </button>
                  
                  {selectedTicket.type === 'emergency' && (
                    <button 
                      className="btn btn-emergency"
                      onClick={() => triggerEmergencyProtocol(selectedTicket.id)}
                    >
                      🚨 Emergency Protocol
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <h3>📋 Select a ticket to view details</h3>
              <p>Choose a ticket from the queue to start helping customers.</p>
            </div>
          )}
        </div>

        {/* Live Chat */}
        <div className="panel chat-panel">
          <h3 className="panel-title">💬 Live Communication</h3>
          
          {selectedTicket ? (
            <>
              <div className="chat-messages">
                {(selectedTicket.messages || []).map((message, index) => (
                  <div key={index} className={`message ${message.senderType}`}>
                    <div className="message-header">
                      {message.senderType === 'captain' && '👨‍✈️ Captain'}
                      {message.senderType === 'rider' && '👤 Customer'}
                      {message.senderType === 'agent' && '🎧 Support Agent'}
                      {message.senderType === 'system' && '🤖 System'}
                      <span className="message-time">
                        {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Recent'}
                      </span>
                    </div>
                    <div className="message-content">{message.message}</div>
                  </div>
                ))}
              </div>
              
              <div className="chat-input">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn btn-primary" onClick={sendMessage}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat">
              <p>Select a ticket to start communication</p>
            </div>
          )}
        </div>

        {/* Support Tools */}
        <div className="panel tools-panel">
          <h3 className="panel-title">🛠️ Support Tools</h3>
          
          <div className="tool-section">
            <input type="text" className="search-box" placeholder="Search tickets, rides, users..." />
          </div>
          
          <div className="tool-section">
            <div className="tool-label">Quick Actions</div>
            <button className="btn tool-button btn-primary">📍 GPS Tracking</button>
            <button className="btn tool-button btn-primary">📞 Conference Call</button>
            <button className="btn tool-button btn-primary">📧 Send Email</button>
            <button className="btn tool-button btn-warning">💳 Process Refund</button>
            <button className="btn tool-button btn-success">✅ Issue Credit</button>
            <button className="btn tool-button btn-danger">🚫 Account Action</button>
          </div>

          <div className="tool-section">
            <div className="tool-label">Emergency Contacts</div>
            <button className="btn tool-button btn-emergency">🚨 Coast Guard</button>
            <button className="btn tool-button btn-warning">👨‍💼 Supervisor</button>
            <button className="btn tool-button btn-primary">🏢 Operations</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPanel;