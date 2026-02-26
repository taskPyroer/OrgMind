
import React from 'react';
import { Row, Col, Typography, Space, Divider } from 'antd';
import type { FooterConfig } from '@/services/portal/api';

const { Title, Paragraph, Text, Link } = Typography;

interface FooterProps {
  config: FooterConfig;
}

const Footer: React.FC<FooterProps> = ({ config }) => {
  const { logo, description, linkGroups, copyright } = config;

  return (
    <div style={{ backgroundColor: '#001529', paddingTop: '80px', paddingBottom: '32px', color: 'rgba(255,255,255,0.65)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <Row gutter={[48, 32]}>
          {/* Logo and Description Area */}
          <Col xs={24} md={10}>
            <Space align="center" style={{ marginBottom: '24px' }}>
              {logo.icon ? <img src={logo.icon} alt="Logo" style={{ height: '32px' }} /> : null}
              <Title level={4} style={{ margin: 0, color: '#fff' }}>{logo.text}</Title>
            </Space>
            <Paragraph style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '28px', maxWidth: '400px', fontSize: '16px' }}>
              {description}
            </Paragraph>
          </Col>

          {/* Link Groups */}
          <Col xs={24} md={14}>
            <Row gutter={[32, 32]}>
              {linkGroups.map((group, index) => (
                <Col xs={24} sm={8} key={index}>
                  <Title level={5} style={{ marginBottom: '24px', color: '#fff' }}>{group.name}</Title>
                  <Space direction="vertical" size={16}>
                    {group.links.map((link, idx) => (
                      <Link 
                        key={idx} 
                        href={link.link} 
                        target="_blank"
                        style={{ color: 'rgba(255,255,255,0.65)', display: 'block' }}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </Space>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        <Divider style={{ margin: '40px 0 24px', borderColor: 'rgba(255,255,255,0.15)' }} />

        {/* Copyright Area */}
        <div style={{ textAlign: 'center' }}>
          <Space split={<Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />} wrap style={{ justifyContent: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.45)' }}>{copyright.company}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)' }}>{copyright.icp}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)' }}>{copyright.text}</Text>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default Footer;
