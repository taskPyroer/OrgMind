
import React, { useState, useEffect } from 'react';
import { Button, Space, theme, Input } from 'antd';
import { EyeOutlined, GithubOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
import type { TopBarConfig } from '@/services/portal/api';
import AIChatModal from '../AIChatModal';

interface TopBarProps {
  config: TopBarConfig;
}

const TopBar: React.FC<TopBarProps> = ({ config }) => {
  const { logo, buttons } = config;
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  
  const [chatVisible, setChatVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setChatVisible(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      padding: '0 24px',
      boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      height: '64px',
      borderBottom: '1px solid rgba(0,0,0,0.03)'
    }}>
      <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {logo.src ? <img src={logo.src} alt={logo.alt} style={{ height: 32 }} /> : null}
        <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>{logo.text}</span>
      </div>

      <div style={{ flex: 1 }} />

      <Space size={16}>
        {/* AI Search Trigger */}
        <div 
          onClick={() => setChatVisible(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(242, 244, 247, 0.8)', // Light gray-blue background
            border: '1px solid transparent',
            borderRadius: '20px', // Capsule shape
            padding: '4px 4px 4px 16px', 
            width: '420px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(235, 239, 245, 1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(242, 244, 247, 0.8)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)';
          }}
        >
          <SearchOutlined style={{ color: '#595959', fontSize: '18px' }} />
          <span style={{ marginLeft: '12px', color: '#8c8c8c', fontSize: '15px', fontWeight: 500 }}>问问 AI 吧</span>
          
          {/* Decorative dots */}
          <div style={{ display: 'flex', gap: '6px', margin: '0 16px', opacity: 0.2 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1890ff' }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1890ff' }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1890ff' }} />
          </div>

          <div style={{ flex: 1 }} />

          <span style={{ 
            color: '#262626', 
            fontSize: '13px', 
            marginRight: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            opacity: 0.8
          }}>Ctrl+K</span>
          
          <div style={{
            backgroundColor: '#fff',
            padding: '0 16px',
            borderRadius: '16px',
            fontSize: '13px',
            color: '#262626',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            height: '32px'
          }}>
            智能问答
          </div>
        </div>

        {buttons.map((btn, index) => {
          let Icon = null;
          // Simple logic to choose icon based on context or explicit 'Preview' flag
          if (btn.icon === 'Preview') {
            if (btn.text.toLowerCase().includes('github')) {
              Icon = <GithubOutlined />;
            } else if (btn.text.includes('关于') || btn.text.includes('About')) {
              Icon = <LinkOutlined />;
            } else {
              Icon = <EyeOutlined />;
            }
          }

          return (
            <Button
              key={index}
              type={btn.style === 'contained' ? 'primary' : btn.style === 'outlined' ? 'default' : 'text'}
              href={btn.link}
              target={btn.target}
              icon={Icon}
            >
              {btn.text}
            </Button>
          );
        })}
      </Space>
      
      <AIChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        initialQuery=""
      />
    </div>
  );
};

export default TopBar;
