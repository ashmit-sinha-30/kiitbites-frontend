'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Mail, MailOpen, Calendar, User, MessageSquare, Search, Filter } from 'lucide-react';
import styles from './styles/helpMessages.module.scss';

interface HelpMessage {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  isRead?: boolean;
}

const HelpMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [selectedMessage, setSelectedMessage] = useState<HelpMessage | null>(null);

  // Fetch help messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/help-messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch help messages');
      }
      
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      } else {
        throw new Error(data.message || 'Failed to fetch help messages');
      }
    } catch (err) {
      console.error('Error fetching help messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch help messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/help-messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId 
              ? { ...msg, isRead: true }
              : msg
          )
        );
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Mark message as unread
  const markAsUnread = async (messageId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/help-messages/${messageId}/unread`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId 
              ? { ...msg, isRead: false }
              : msg
          )
        );
      }
    } catch (err) {
      console.error('Error marking message as unread:', err);
    }
  };

  // Filter and search messages
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'read' && message.isRead) ||
                         (filterStatus === 'unread' && !message.isRead);
    
    return matchesSearch && matchesFilter;
  });

  // Get message statistics
  const totalMessages = messages.length;
  const unreadMessages = messages.filter(msg => !msg.isRead).length;
  const readMessages = messages.filter(msg => msg.isRead).length;

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loader} />
        <p>Loading help messages...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Help Messages Management</h1>
        <p className={styles.subtitle}>
          View and manage customer support messages from the help page
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`${styles.alert} ${styles.errorAlert}`}>
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <CardContent className={styles.statContent}>
            <div className={styles.statIcon}>
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statNumber}>{totalMessages}</p>
              <p className={styles.statLabel}>Total Messages</p>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardContent className={styles.statContent}>
            <div className={`${styles.statIcon} ${styles.unreadIcon}`}>
              <Mail className="h-6 w-6" />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statNumber}>{unreadMessages}</p>
              <p className={styles.statLabel}>Unread Messages</p>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardContent className={styles.statContent}>
            <div className={`${styles.statIcon} ${styles.readIcon}`}>
              <MailOpen className="h-6 w-6" />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statNumber}>{readMessages}</p>
              <p className={styles.statLabel}>Read Messages</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className={styles.controlsCard}>
        <CardContent className={styles.controlsContent}>
          <div className={styles.searchContainer}>
            <div className={styles.searchInputContainer}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search messages by name, email, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.filterContainer}>
            <Filter className={styles.filterIcon} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'read' | 'unread')}
              className={styles.filterSelect}
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>

          <Button
            onClick={fetchMessages}
            variant="outline"
            disabled={loading}
            className={styles.refreshButton}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className={styles.messagesGrid}>
        {filteredMessages.length === 0 ? (
          <Card className={styles.emptyCard}>
            <CardContent className={styles.emptyContent}>
              <MessageSquare className={styles.emptyIcon} />
              <h3>No messages found</h3>
              <p>No help messages match your current search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card 
              key={message._id} 
              className={`${styles.messageCard} ${!message.isRead ? styles.unreadCard : ''}`}
              onClick={() => {
                setSelectedMessage(message);
                if (!message.isRead) {
                  markAsRead(message._id);
                }
              }}
            >
              <CardHeader className={styles.messageHeader}>
                <div className={styles.messageTitleRow}>
                  <div className={styles.messageInfo}>
                    <h3 className={styles.messageName}>{message.name}</h3>
                    <p className={styles.messageEmail}>{message.email}</p>
                  </div>
                  <div className={styles.messageBadges}>
                    {!message.isRead && (
                      <Badge variant="destructive" className={styles.unreadBadge}>
                        Unread
                      </Badge>
                    )}
                    <Badge variant="outline" className={styles.dateBadge}>
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(message.createdAt)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className={styles.messageContent}>
                <p className={styles.messagePreview}>
                  {message.message.length > 150 
                    ? `${message.message.substring(0, 150)}...` 
                    : message.message
                  }
                </p>
                <div className={styles.messageActions}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMessage(message);
                    }}
                  >
                    View Full Message
                  </Button>
                  {message.isRead ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsUnread(message._id);
                      }}
                    >
                      Mark as Unread
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(message._id);
                      }}
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMessage(null)}>
          <Card className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <CardHeader className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <div>
                  <CardTitle className={styles.modalTitle}>{selectedMessage.name}</CardTitle>
                  <CardDescription className={styles.modalEmail}>{selectedMessage.email}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </Button>
              </div>
              <div className={styles.modalBadges}>
                <Badge variant="outline" className={styles.dateBadge}>
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(selectedMessage.createdAt)}
                </Badge>
                {!selectedMessage.isRead && (
                  <Badge variant="destructive" className={styles.unreadBadge}>
                    Unread
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className={styles.modalContent}>
              <div className={styles.modalMessage}>
                <h4 className={styles.modalMessageTitle}>Message:</h4>
                <p className={styles.modalMessageText}>{selectedMessage.message}</p>
              </div>
              <div className={styles.modalActions}>
                {selectedMessage.isRead ? (
                  <Button
                    onClick={() => {
                      markAsUnread(selectedMessage._id);
                      setSelectedMessage({ ...selectedMessage, isRead: false });
                    }}
                    variant="outline"
                  >
                    Mark as Unread
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      markAsRead(selectedMessage._id);
                      setSelectedMessage({ ...selectedMessage, isRead: true });
                    }}
                    variant="outline"
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HelpMessagesPage;
