import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Space, Typography, Tag, Avatar, Skeleton, Divider } from 'antd';
import { UserOutlined, RobotOutlined, SendOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import { XMarkdown } from '@ant-design/x-markdown';
import { chatStream } from '@/services/ant-design-pro/rag';

const { Title, Paragraph, Text } = Typography;

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery: string;
  kbIds?: string[];
  copyright?: {
    show: boolean;
    text: string;
  };
}

interface Source {
  title: string;
  content: string;
  score?: number;
  [key: string]: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  status?: 'loading' | 'done' | 'error';
  sources?: Source[];
}

const AIChatModal: React.FC<AIChatModalProps> = ({ visible, onClose, initialQuery, kbIds, copyright }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && initialQuery) {
      handleSearch(initialQuery);
    }
    if (!visible) {
      setMessages([]);
      setQuery('');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [visible, initialQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMarkdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href) {
        e.preventDefault();
        window.open(href, '_blank');
      }
    }
  };

  const handleSearch = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    // Prepare assistant message placeholder
    const assistantMsgId = Date.now();
    setMessages(prev => [...prev, { role: 'assistant', content: '', status: 'loading' }]);

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await chatStream({
        question: text,
        kb_ids: kbIds || [],
        source: 'portal'
      }, {
        signal: abortControllerRef.current!.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let currentContent = '';
      let currentSources: Source[] = [];

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        
        const lines = chunkValue.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.status === 'sources') {
              currentSources = data.sources;
              // Update sources immediately
              setMessages(prev => {
                const newMsgs = [...prev];
                const lastMsg = newMsgs[newMsgs.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.sources = currentSources;
                }
                return newMsgs;
              });
            } else if (data.status === 'loading' && data.msg?.content) {
              currentContent += data.msg.content;
              // Update content
              setMessages(prev => {
                const newMsgs = [...prev];
                const lastMsg = newMsgs[newMsgs.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.content = currentContent;
                }
                return newMsgs;
              });
            } else if (data.status === 'finished') {
              setMessages(prev => {
                const newMsgs = [...prev];
                const lastMsg = newMsgs[newMsgs.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.status = 'done';
                }
                return newMsgs;
              });
            }
          } catch (e) {
            console.error('Error parsing stream line', e);
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMessages(prev => {
           const newMsgs = [...prev];
           const lastMsg = newMsgs[newMsgs.length - 1];
           if (lastMsg.role === 'assistant') {
             lastMsg.content += '\n\n**Error:** Failed to get response.';
             lastMsg.status = 'error';
           }
           return newMsgs;
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 40, paddingBottom: 0 }}
      styles={{ body: { padding: 0, height: '80vh', display: 'flex', flexDirection: 'column' } }}
      closeIcon={null}
      maskClosable={false}
    >
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
           <Button type="primary" shape="round" icon={<RobotOutlined />}>智能问答</Button>
           <Input 
             prefix={<FileTextOutlined style={{color: '#ccc'}} />} 
             placeholder="仅搜索文档" 
             style={{ width: 200, borderRadius: 20, background: '#f5f5f5', border: 'none' }} 
             variant="borderless"
           />
        </Space>
        <Button icon={<CloseOutlined />} onClick={onClose}>Esc</Button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#fafafa' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: 32 }}>
            {msg.role === 'user' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '80%', background: '#1677ff', color: '#fff', padding: '12px 20px', borderRadius: '20px 20px 0 20px', fontSize: 16 }}>
                  {msg.content}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                 <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff', marginRight: 16, flexShrink: 0 }} />
                 <div style={{ flex: 1, maxWidth: '90%' }}>
                    {msg.sources && msg.sources.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            {(() => {
                                const sourceStats = msg.sources.reduce((acc, src) => {
                                    const title = src.title || src.metadata?.title || '未知文档';
                                    if (!acc[title]) {
                                        acc[title] = { count: 0, metadata: src.metadata };
                                    }
                                    acc[title].count += 1;
                                    return acc;
                                }, {} as Record<string, { count: number, metadata: any }>);

                                return (
                                    <>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            共引用 {Object.keys(sourceStats).length} 个文档 ({msg.sources.length} 个片段)
                                        </Text>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                            {Object.entries(sourceStats).map(([title, { count, metadata }], i) => (
                                                <Tag 
                                                    key={i} 
                                                    icon={<FileTextOutlined />} 
                                                    color="blue" 
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => {
                                                        if (metadata?.kb_id && metadata?.doc_id) {
                                                            window.open(`/rag/knowledge-base/${metadata.kb_id}/view?docId=${metadata.doc_id}`, '_blank');
                                                        }
                                                    }}
                                                >
                                                    {title} {count > 1 ? `x${count}` : ''}
                                                </Tag>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                    
                    <div 
                        style={{ background: '#fff', padding: '24px', borderRadius: '0 20px 20px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                        onClick={handleMarkdownClick}
                    >
                       {msg.content ? (
                           <div className="markdown-body">
                               <XMarkdown content={msg.content} />
                           </div>
                       ) : (
                           <Skeleton active paragraph={{ rows: 4 }} />
                       )}
                       {msg.status === 'loading' && <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>正在思考...</Text>}
                    </div>
                 </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Input */}
      <div style={{ padding: '24px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
         <div style={{ border: '1px solid #d9d9d9', borderRadius: 12, padding: '8px 16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <Input.TextArea
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="问问 AI 吧..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                variant="borderless"
                style={{ fontSize: 16, resize: 'none' }}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSearch(query);
                    }
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Space>
                    <Button type="text" icon={<FileTextOutlined />} size="small" style={{ color: '#666' }} />
                </Space>
                <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<SendOutlined />} 
                    onClick={() => handleSearch(query)} 
                    loading={loading}
                    disabled={!query.trim()}
                />
            </div>
         </div>
         {(copyright?.show ?? true) && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{copyright?.text || '本网站由 OrgMind AI 提供技术支持'}</Text>
            </div>
         )}
      </div>
    </Modal>
  );
};

export default AIChatModal;
