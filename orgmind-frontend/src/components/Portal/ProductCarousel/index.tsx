import React from 'react';
import { Carousel, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { ProductCarouselConfig } from '@/services/portal/api';

const { Title } = Typography;

interface ProductCarouselProps {
  config: ProductCarouselConfig;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ config }) => {
  const { title, images } = config;

  const contentStyle: React.CSSProperties = {
    margin: 0,
    height: '495px', // 880 * 495 ratio
    color: '#fff',
    lineHeight: '495px',
    textAlign: 'center',
    background: '#364d79',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const ArrowButton = ({ type, onClick }: { type: 'prev' | 'next'; onClick?: () => void }) => {
    return (
      <div
        onClick={onClick}
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          [type === 'prev' ? 'left' : 'right']: 16,
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)', // Distinct shadow
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        }}
      >
        {type === 'prev' ? <LeftOutlined /> : <RightOutlined />}
      </div>
    );
  };

  return (
    <div style={{ padding: '60px 20px', backgroundColor: '#fff' }}>
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2} style={{ margin: '0 0 16px', fontWeight: 600 }}>
            {title}
          </Title>
           <div style={{ width: '40px', height: '4px', background: '#52c41a', margin: '0 auto', borderRadius: '2px' }} />
        </div>
        <Carousel 
          autoplay 
          effect="fade"
          arrows
          prevArrow={<ArrowButton type="prev" />}
          nextArrow={<ArrowButton type="next" />}
          style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
        >
          {images.map((imgSrc, index) => (
            <div key={index}>
              <div style={contentStyle}>
                 {imgSrc ? <img src={imgSrc} alt={`Product ${index + 1}`} style={imageStyle} /> : null}
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default ProductCarousel;
