import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, List, Card, Avatar, Select, Spin, Typography, Tabs, Popconfirm, message, Empty, Tooltip, Collapse } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, SettingOutlined, ClockCircleOutlined, DeleteOutlined, ClearOutlined, ReadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { chat, chatStream, getKnowledgeBases, getChatHistory, deleteChatHistory, clearChatHistory } from '@/services/ant-design-pro/rag';
import ProCard from '@ant-design/pro-card';
import { XMarkdown } from '@ant-design/x-markdown';

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: API.ChatResponse['sources'];
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [kbList, setKbList] = useState<API.KnowledgeBase[]>([]);
  const [selectedKbs, setSelectedKbs] = useState<string[]>([]);
  const [history, setHistory] = useState<API.ChatHistory[]>([]);
  const [activeTab, setActiveTab] = useState('settings');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    // Load KBs for selection
    getKnowledgeBases({ current: 1, pageSize: 100 }).then((res) => {
      setKbList(res.data || []);
    });
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getChatHistory({ current: 1, pageSize: 20 });
      setHistory(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearChatHistory();
      setHistory([]);
      messageApi.success('历史记录已清空');
    } catch (error) {
      messageApi.error('清空失败');
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteChatHistory(id.toString());
      setHistory((prev) => prev.filter((h) => h.id !== id));
      messageApi.success('删除成功');
    } catch (error) {
      messageApi.error('删除失败');
    }
  };

  const restoreHistory = (item: API.ChatHistory) => {
    setMessages([
      { id: `q-${item.id}`, role: 'user', content: item.question },
      { id: `a-${item.id}`, role: 'assistant', content: item.answer }
    ]);
  };

  const handleMarkdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('/rag/knowledge-base/')) {
            e.preventDefault();
            window.open(href, '_blank');
        }
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '', // Initial empty content
      sources: [],
    };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      const response = await chatStream({
        question: userMsg.content,
        kb_ids: selectedKbs.length > 0 ? selectedKbs : undefined,
        source: 'internal'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let buffer = '';
      let firstChunkReceived = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Stop loading spinner as soon as we receive data
        if (!firstChunkReceived) {
            setLoading(false);
            firstChunkReceived = true;
        }

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        // Keep the last part in buffer as it might be incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          try {
            const chunk = JSON.parse(trimmedLine);
            const { status, msg, sources } = chunk;
            
            if (status === 'loading') {
              const content = msg?.content || '';
              if (content) {
                setMessages((prev) => prev.map(m => 
                  m.id === aiMsgId ? { ...m, content: m.content + content } : m
                ));
                
                // Auto scroll to bottom
                if (scrollRef.current) {
                   scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              }
            } else if (status === 'sources' && sources) {
              setMessages((prev) => prev.map(m => 
                m.id === aiMsgId ? { ...m, sources: sources } : m
              ));
            } else if (status === 'finished') {
              console.log('Stream finished');
            } else if (status === 'error') {
               console.error('Stream error:', chunk);
               setMessages((prev) => prev.map(m => 
                m.id === aiMsgId ? { ...m, content: m.content + '\n\n[系统提示: ' + (chunk.error_message || '未知错误') + ']' } : m
               ));
            }
          } catch (e) {
            console.warn('Error parsing JSON chunk:', e, trimmedLine);
          }
        }
      }
      
      loadHistory(); // Refresh history after stream ends
      
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages((prev) => prev.map(m => 
        m.id === aiMsgId ? { ...m, content: m.content + '\n\n[系统提示: 连接中断或发生错误]' } : m
      ));
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  return (
    <PageContainer>
      {contextHolder}
      <ProCard split="vertical" bordered>
        <ProCard colSpan="350px" tabs={{
          activeKey: activeTab,
          onChange: setActiveTab,
          items: [
            {
              label: <span><SettingOutlined />设置</span>,
              key: 'settings',
              children: (
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>选择知识库</Text>
                    <Select
                      mode="multiple"
                      style={{ width: '100%', marginTop: 8 }}
                      placeholder="默认全选"
                      onChange={(vals) => setSelectedKbs(vals as string[])}
                      options={kbList.map((kb) => ({ label: kb.name, value: kb.id }))}
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      提示：未选择知识库时，将检索所有您有权限访问的知识库。
                    </Text>
                  </div>
                </div>
              )
            },
            {
              label: <span><ClockCircleOutlined />历史</span>,
              key: 'history',
              children: (
                <div style={{ marginTop: 16 }}>
                   <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>最近对话</Text>
                      {history.length > 0 && (
                        <Popconfirm title="确定清空所有历史记录吗？" onConfirm={handleClearHistory}>
                          <Button type="link" danger icon={<ClearOutlined />} size="small">清空</Button>
                        </Popconfirm>
                      )}
                   </div>
                   <div style={{ height: '60vh', overflowY: 'auto' }}>
                      <List
                        dataSource={history}
                        renderItem={item => (
                          <List.Item 
                            style={{ cursor: 'pointer', padding: '12px', borderBottom: '1px solid #f0f0f0', transition: 'background 0.3s' }}
                            className="history-item"
                            onClick={() => restoreHistory(item)}
                            actions={[
                              <Popconfirm 
                                key="del" 
                                title="删除此条记录？" 
                                onConfirm={(e) => handleDeleteHistory(e!, item.id)}
                                onCancel={(e) => e?.stopPropagation()}
                              >
                                <Button 
                                  type="text" 
                                  danger 
                                  icon={<DeleteOutlined />} 
                                  size="small" 
                                  onClick={(e) => e.stopPropagation()} 
                                />
                              </Popconfirm>
                            ]}
                          >
                            <List.Item.Meta
                              title={<Text ellipsis={{ tooltip: item.question }} style={{ maxWidth: 200 }}>{item.question}</Text>}
                              description={
                                <div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>{item.created_at}</Text>
                                  {(item.ip_address || item.ip_location) && (
                                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                       {item.ip_address && <span style={{ marginRight: '8px' }}>IP: {item.ip_address}</span>}
                                       {item.ip_location && <span>{item.ip_location}</span>}
                                    </div>
                                  )}
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                        locale={{ emptyText: <Empty description="暂无历史记录" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                      />
                   </div>
                </div>
              )
            }
          ]
        }} headerBordered>
        </ProCard>
        
        <ProCard title="智能助手" headerBordered>
          <div
            ref={scrollRef}
            style={{
              height: '65vh',
              overflowY: 'auto',
              padding: '20px',
              marginBottom: 16,
              background: '#f0f2f5',
              borderRadius: 12,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 100, color: '#999' }}>
                <div style={{ 
                  width: 80, height: 80, background: '#e6f7ff', borderRadius: '50%', 
                  margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <RobotOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </div>
                <Typography.Title level={4} style={{ marginBottom: 8 }}>我是您的智能助手</Typography.Title>
                <p>我可以帮您查询企业知识库、解答业务问题。</p>
                <p style={{ fontSize: 12 }}>试着问我："最新的财务报销流程是什么？"</p>
              </div>
            )}
            
            <List
              dataSource={messages}
              split={false}
              renderItem={(item) => (
                <List.Item style={{ padding: '16px 0', border: 'none', display: 'block' }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: item.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: 12
                  }}>
                    <Avatar
                      icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                      size={40}
                      style={{ 
                        backgroundColor: item.role === 'user' ? '#1890ff' : '#52c41a',
                        flexShrink: 0,
                        marginTop: 4
                      }}
                    />
                    <div style={{ maxWidth: '85%' }}>
                      <div style={{ 
                          padding: '12px 16px',
                          borderRadius: item.role === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                          background: item.role === 'user' ? '#1890ff' : '#fff',
                          color: item.role === 'user' ? '#fff' : '#333',
                          boxShadow: item.role === 'user' ? '0 2px 8px rgba(24, 144, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                          fontSize: 15,
                          lineHeight: 1.6,
                        }}
                        onClick={handleMarkdownClick}
                      >
                        <XMarkdown content={item.content} />
                      </div>
                      
                      {item.sources && item.sources.length > 0 && (
                        <div style={{ marginTop: 8, maxWidth: 600 }}>
                          <Collapse 
                            ghost 
                            size="small"
                            expandIconPosition="end"
                            items={[{
                                key: '1',
                                label: (
                                  <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                                    <ReadOutlined /> 参考了 {new Set(item.sources.map(s => s.metadata?.title || '未知文档')).size} 个文档来源 ({item.sources.length} 个片段)
                                  </span>
                                ),
                              children: (
                                <div>
                                  {Object.values(item.sources.reduce((acc, source) => {
                                    const docId = source.metadata?.doc_id;
                                    const title = source.metadata?.title || '未知文档';
                                    const key = docId || title; // Prefer docId for grouping
                                    
                                    if (!acc[key]) {
                                        acc[key] = {
                                            title,
                                            kbId: source.metadata?.kb_id,
                                            docId,
                                            sources: []
                                        };
                                    }
                                    acc[key].sources.push(source);
                                    return acc;
                                  }, {} as Record<string, { title: string, kbId?: string, docId?: string, sources: typeof item.sources }>)).map((group, groupIdx) => (
                                    <div key={groupIdx} style={{ marginBottom: 12 }}>
                                      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 8, color: '#1890ff', display: 'flex', alignItems: 'center' }}>
                                         <span style={{ marginRight: 8 }}>{groupIdx + 1}. {group.title}</span>
                                         {group.kbId && group.docId && (
                                            <Tooltip title="在新窗口打开文档">
                                                <ReadOutlined 
                                                    style={{ cursor: 'pointer', fontSize: 14 }} 
                                                    onClick={() => window.open(`/rag/knowledge-base/${group.kbId}/view?docId=${group.docId}`, '_blank')}
                                                />
                                            </Tooltip>
                                         )}
                                      </div>
                                      {group.sources.map((source, idx) => (
                                         <div key={idx} style={{ 
                                           marginBottom: 6, padding: '6px 8px', background: '#f9f9f9', borderRadius: 4,
                                           borderLeft: '2px solid #d9d9d9', marginLeft: 8
                                         }}>
                                           <div style={{ fontSize: 12, color: '#666', maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                             {source.content}
                                           </div>
                                         </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )
                            }]}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}>
                 <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a', marginRight: 8 }} />
                 <Spin />
              </div>
            )}
          </div>

          <div style={{ display: 'flex' }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请输入您的问题..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              style={{ height: 'auto', marginLeft: 8 }}
              loading={loading}
            >
              发送
            </Button>
          </div>
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};

export default ChatPage;
