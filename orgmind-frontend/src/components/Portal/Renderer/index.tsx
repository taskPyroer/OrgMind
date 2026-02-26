
import React from 'react';
import TopBar from '../TopBar';
import Banner from '../Banner';
import RecommendedDocs from '../RecommendedDocs';
import ProductCarousel from '../ProductCarousel';
import FAQ from '../FAQ';
import Footer from '../Footer';
import type { ComponentConfig, SiteSettings } from '@/services/portal/api';

interface RendererProps {
  components: ComponentConfig[];
  siteSettings?: SiteSettings;
}

const componentMap: Record<string, React.FC<any>> = {
  'TopBar': TopBar,
  'Banner': Banner,
  'RecommendedDocs': RecommendedDocs,
  'ProductCarousel': ProductCarousel,
  'FAQ': FAQ,
  'Footer': Footer,
};

const PortalRenderer: React.FC<RendererProps> = ({ components, siteSettings }) => {
  if (!components || components.length === 0) {
    return <div>No content configured.</div>;
  }

  return (
    <div className="portal-container">
      {components.map((component) => {
        const Component = componentMap[component.type];
        if (!Component) {
          console.warn(`Component type ${component.type} not found`);
          return null;
        }
        return <Component key={component.id} config={component.props} siteSettings={siteSettings} />;
      })}
    </div>
  );
};

export default PortalRenderer;
