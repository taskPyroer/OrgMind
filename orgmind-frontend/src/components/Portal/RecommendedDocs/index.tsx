
import React from 'react';
import { Typography, Row, Col, Card } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import type { RecommendedDocsConfig } from '@/services/portal/api';

const { Title, Paragraph } = Typography;

interface RecommendedDocsProps {
  config: RecommendedDocsConfig;
}

const RecommendedDocs: React.FC<RecommendedDocsProps> = ({ config }) => {
  const { title, items } = config;

  return (
    <div style={{ padding: '60px 20px', backgroundColor: '#f7f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2} style={{ margin: '0 0 16px', fontWeight: 600 }}>
            {title}
          </Title>
          <div style={{ width: '40px', height: '4px', background: '#1890ff', margin: '0 auto', borderRadius: '2px' }} />
        </div>
        <Row gutter={[24, 24]}>
          {items.map((item, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                variant="borderless"
                style={{ height: '100%', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                styles={{ body: { padding: '32px 24px' } }}
                onClick={() => {
                   if(item.link) window.open(item.link, '_blank');
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '8px', 
                      background: '#e6f7ff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                    </div>
                    <Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                      {item.title}
                    </Title>
                  </div>
                  <Paragraph 
                    style={{ 
                      color: '#666', 
                      fontSize: '14px', 
                      lineHeight: '24px', 
                      marginBottom: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {item.summary}
                  </Paragraph>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default RecommendedDocs;
