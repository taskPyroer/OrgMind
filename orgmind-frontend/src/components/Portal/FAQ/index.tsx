
import React from 'react';
import { Typography, Row, Col, Card } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { FAQConfig } from '@/services/portal/api';

const { Title } = Typography;

interface FAQProps {
  config: FAQConfig;
}

const FAQ: React.FC<FAQProps> = ({ config }) => {
  const { title, items } = config;

  return (
    <div style={{ padding: '60px 20px', backgroundColor: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2} style={{ margin: '0 0 16px', fontWeight: 600 }}>
            {title}
          </Title>
          <div style={{ width: '40px', height: '4px', background: '#faad14', margin: '0 auto', borderRadius: '2px' }} />
        </div>
        <Row gutter={[24, 24]} justify="center">
          {items.map((item, index) => (
            <Col xs={24} sm={12} md={10} key={index}>
              <div
                style={{ 
                  borderRadius: '12px', 
                  border: '1px solid #f0f0f0',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
                onClick={() => {
                   if(item.link) window.open(item.link, '_blank');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#faad14';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                  <div style={{ 
                      minWidth: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: '#fff7e6', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#faad14'
                  }}>
                    <QuestionCircleOutlined style={{ fontSize: '20px' }} />
                  </div>
                  <Title level={5} style={{ margin: 0, fontSize: '16px', fontWeight: 500, flex: 1 }}>
                    {item.question}
                  </Title>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default FAQ;
