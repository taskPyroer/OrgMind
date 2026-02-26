
import React, { useEffect, useState } from 'react';
import { Layout, Result, Button } from 'antd';
import { Helmet, history, useModel } from '@umijs/max';
import PortalRenderer from '@/components/Portal/Renderer';
import { getPortalConfig, type PortalConfig } from '@/services/portal/api';

const { Content } = Layout;

/**
 * 门户首页组件
 * 负责加载和渲染门户的动态配置
 */
const PortalHome: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  // 门户配置数据状态
  const [config, setConfig] = useState<PortalConfig | null>(null);
  // 加载状态
  const [loading, setLoading] = useState(true);

  // 初始化时加载配置
  useEffect(() => {
    getPortalConfig().then((res) => {
      // 兼容处理：部分请求库可能会将数据包裹在 data 字段中，部分直接返回
      // @ts-ignore
      const data = res.data || res;
      setConfig(data);
      setLoading(false);
    });
  }, []);

  // 加载中显示 loading 提示
  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>正在加载门户...</div>;
  }

  const { siteSettings } = config || {};

  // 访问控制：禁止访问
  if (siteSettings?.accessControl === 'forbidden') {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#fff' 
      }}>
        <Result
          status="403"
          title="站点已禁止访问"
          subTitle="抱歉，管理员已暂时关闭了该站点的访问权限。"
        />
      </div>
    );
  }

  // 访问控制：需要登录
  if (siteSettings?.accessControl === 'auth' && !initialState?.currentUser) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#fff' 
      }}>
        <Result
          status="403"
          title="需要登录"
          subTitle="该站点需要登录后才能访问。"
          extra={
            <Button type="primary" onClick={() => history.push(`/user/login?redirect=${encodeURIComponent(window.location.pathname)}`)}>
              去登录
            </Button>
          }
        />
      </div>
    );
  }

  // 渲染门户布局
  return (
    <Layout className="layout" style={{ minHeight: '100vh', background: '#fff' }}>
      {siteSettings && (
        <Helmet>
           {siteSettings.seo?.description && <meta name="description" content={siteSettings.seo.description} />}
           {siteSettings.seo?.keywords && <meta name="keywords" content={siteSettings.seo.keywords} />}
        </Helmet>
      )}
      <Content style={{ padding: 0 }}>
        {/* 根据配置动态渲染组件列表 */}
        {config && <PortalRenderer components={config.components} siteSettings={siteSettings} />}
        {siteSettings?.customCode?.body && (
           <div dangerouslySetInnerHTML={{ __html: siteSettings.customCode.body }} />
        )}
      </Content>
    </Layout>
  );
};

export default PortalHome;
