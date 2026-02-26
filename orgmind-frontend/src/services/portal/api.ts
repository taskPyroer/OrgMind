
import { request } from '@umijs/max';

export interface TopBarConfig {
  logo: {
    src: string;
    alt: string;
    text: string;
  };
  buttons: {
    text: string;
    link: string;
    style: 'text' | 'contained' | 'outlined';
    target: '_blank' | '_self';
    icon?: string;
  }[];
}

export interface BannerConfig {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  buttons: {
    text: string;
    type: 'primary' | 'default' | 'link' | 'text' | 'dashed';
    link?: string;
  }[];
  hotSearchTags?: string[];
  knowledge_base_ids?: string[];
}

export interface KnowledgeBase {
    id: string;
    name: string;
    description?: string;
}

export async function getKnowledgeBases() {
    return request<{ data: KnowledgeBase[] }>('/api/v1/rag/knowledge-bases/', {
        method: 'GET',
        params: { pageSize: 100 }, // Fetch enough for selection
    });
}

export interface RecommendedDocItem {
  id: string;
  title: string;
  summary: string;
  link: string;
}

export interface RecommendedDocsConfig {
  title: string;
  items: RecommendedDocItem[];
}

export interface ProductCarouselConfig {
  title: string;
  images: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  link: string;
}

export interface FAQConfig {
  title: string;
  items: FAQItem[];
}

export interface LinkItem {
  name: string;
  link: string;
}

export interface LinkGroup {
  name: string;
  links: LinkItem[];
}

export interface FooterConfig {
  logo: {
    icon: string;
    text: string;
  };
  description: string;
  linkGroups: LinkGroup[];
  copyright: {
    company: string;
    icp: string;
    text: string;
  };
}

export interface ComponentConfig {
  id: string;
  type: 'TopBar' | 'Banner' | 'RecommendedDocs' | 'ProductCarousel' | 'FAQ' | 'Features' | 'Footer';
  props: TopBarConfig | BannerConfig | RecommendedDocsConfig | ProductCarouselConfig | FAQConfig | FooterConfig | any;
}

export interface SiteSettings {
  // 服务监听
  host?: string;
  enableHttp?: boolean;
  httpPort?: number;
  enableHttps?: boolean;
  httpsPort?: number;
  certFile?: string;
  keyFile?: string;
  proxyMode?: 'none' | 'forward'; // none: 无前置反向代理, forward: 有前置反向代理

  // 网站基本信息
  baseUrl?: string;
  
  // 智能问答版权信息
  copyright?: {
    show: boolean; // true: 显示, false: 隐藏
    text: string;
  };

  // 访问认证
  accessControl?: 'public' | 'auth' | 'forbidden'; // public: 完全公开, auth: 需要认证, forbidden: 禁止访问

  // 左侧目录导航
  sidebar?: {
    show: boolean; // 默认显示/隐藏
    defaultOpen?: boolean; // 文件夹默认展开/折叠
    width?: number;
  };

  // SEO
  seo?: {
    description?: string;
    keywords?: string;
  };

  // 自定义代码
  customCode?: {
    head?: string;
    body?: string;
  };
}

export interface PortalConfig {
  components: ComponentConfig[];
  siteSettings?: SiteSettings;
}

export async function getPortalConfig() {
  // 手动获取 token 并添加到请求头，确保即使拦截器未生效也能发送 token
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  return request<PortalConfig>('/api/v1/portal/config', {
    method: 'GET',
    headers,
  });
}

export async function savePortalConfig(config: PortalConfig) {
  return request<PortalConfig>('/api/v1/portal/config', {
    method: 'PUT',
    data: config,
  });
}
