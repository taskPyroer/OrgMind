
import React, { useState } from 'react';
import { Typography, Input, Button, Space, Tag, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { BannerConfig, SiteSettings } from '@/services/portal/api';
import AIChatModal from '../AIChatModal';

const { Title, Paragraph } = Typography;

interface BannerProps {
  config: BannerConfig;
  siteSettings?: SiteSettings;
}

const Banner: React.FC<BannerProps> = ({ config, siteSettings }) => {
  const { title, subtitle, searchPlaceholder, buttons, hotSearchTags, knowledge_base_ids } = config;
  const [chatVisible, setChatVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setChatVisible(true);
  };

  const cssAnimations = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes textShine {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    @keyframes float {
      0% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-5px);
      }
      100% {
        transform: translateY(0px);
      }
    }
    
    .banner-title-gradient {
      background: linear-gradient(to right, #ffffff 20%, #8dc5f8 40%, #8dc5f8 60%, #ffffff 80%);
      background-size: 200% auto;
      color: #fff;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: textShine 5s linear infinite;
    }
  `;

  return (
    <div style={{ 
      padding: '120px 20px 100px', 
      textAlign: 'center', 
      backgroundColor: '#001529',
      backgroundImage: 'linear-gradient(180deg, #001529 0%, #003a8c 100%)',
      color: '#fff',
      overflow: 'hidden'
    }}>
      <style>{cssAnimations}</style>
      <Row justify="center">
        <Col xs={24} md={18} lg={16} xl={14}>
          <div style={{ opacity: 0, animation: 'fadeInUp 0.8s ease-out forwards' }}>
            <Title 
              level={1} 
              className="banner-title-gradient"
              style={{ 
                fontSize: '56px', 
                marginBottom: '24px', 
                fontWeight: 700,
                letterSpacing: '1px'
              }}
            >
              {title}
            </Title>
          </div>
          
          <div style={{ opacity: 0, animation: 'fadeInUp 0.8s ease-out 0.2s forwards' }}>
            <Paragraph style={{ fontSize: '20px', color: 'rgba(255,255,255,0.85)', marginBottom: '48px' }}>
              {subtitle}
            </Paragraph>
          </div>

          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto 48px',
            opacity: 0, 
            animation: 'fadeInUp 0.8s ease-out 0.4s forwards'
          }}>
            <div style={{ 
              boxShadow: '0 12px 24px rgba(0,0,0,0.2)', 
              borderRadius: '8px',
              transition: 'transform 0.3s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Input.Search
                placeholder={searchPlaceholder}
                onSearch={handleSearch}
                enterButton={
                  <Button type="primary" style={{ height: 50, fontSize: 16, padding: '0 32px' }}>
                     AI 智能问答
                  </Button>
                }
                size="large"
                style={{ width: '100%' }}
                // Customizing the search input to look good on dark background
                styles={{
                    input: { height: 50, fontSize: 16, lineHeight: '50px' },
                    // @ts-ignore
                    affixWrapper: { height: 50, borderRadius: '8px 0 0 8px', alignItems: 'center', border: 'none' },
                }}
                suffix={<span style={{ color: '#999', marginRight: 8, fontSize: 12 }}>Ctrl+K</span>}
              />
            </div>
            {hotSearchTags && hotSearchTags.length > 0 && (
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {hotSearchTags.map((tag, index) => (
                  <Tag 
                    key={index} 
                    style={{ 
                      padding: '6px 16px', 
                      borderRadius: '20px', 
                      background: 'rgba(255,255,255,0.1)', 
                      border: '1px solid rgba(255,255,255,0.2)', 
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            )}
          </div>

          <Space 
            size="large" 
            style={{ 
              opacity: 0, 
              animation: 'fadeInUp 0.8s ease-out 0.6s forwards' 
            }}
          >
            {buttons.map((btn, index) => (
              <Button 
                key={index} 
                type={btn.type} 
                size="large" 
                href={btn.link}
                ghost={btn.type === 'default'}
                style={{ 
                  minWidth: '140px', 
                  height: '52px', 
                  fontSize: '18px',
                  borderRadius: '6px',
                  animation: index === 0 ? 'float 3s ease-in-out infinite' : 'none',
                  animationDelay: '1s'
                }}
              >
                {btn.text}
              </Button>
            ))}
          </Space>
        </Col>
      </Row>
      <AIChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        initialQuery={searchQuery}
        kbIds={knowledge_base_ids}
        copyright={siteSettings?.copyright}
      />
    </div>
  );
};

export default Banner;
