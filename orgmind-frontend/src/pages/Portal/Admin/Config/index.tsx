
import React, { useEffect, useState } from 'react';
import {
  PageContainer,
  ProCard,
  ProFormText,
  ProFormList,
  ProFormGroup,
  DrawerForm,
  ProFormSelect,
  ProFormTextArea,
  ProFormUploadButton,
  ProForm,
  ProFormSwitch,
  ProFormDigit,
  ProFormRadio,
  ProFormDependency,
} from '@ant-design/pro-components';
import { Button, App, List, Tag, Card, Space, Divider } from 'antd';
import { GlobalOutlined, SafetyCertificateOutlined, CodeOutlined, SearchOutlined, ClusterOutlined } from '@ant-design/icons';
import {
  getPortalConfig,
  savePortalConfig,
  getKnowledgeBases,
  type PortalConfig,
  type ComponentConfig,
} from '@/services/portal/api';

const PortalConfigPage: React.FC = () => {
  const { message } = App.useApp();
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRow, setCurrentRow] = useState<ComponentConfig | undefined>(undefined);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    loadConfig();
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    try {
        const res = await getKnowledgeBases();
        // @ts-ignore
        // Fix: Backend returns { data: [...], ... } where data is the array itself
        const list = Array.isArray(res.data) ? res.data : (res.data?.items || res.items || []);
        setKnowledgeBases(list.map((kb: any) => ({ label: kb.name, value: kb.id })));
    } catch (error) {
        console.error("Failed to load knowledge bases", error);
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await getPortalConfig();
      // The backend returns the config object directly, or wrapped in data depending on request config.
      // Based on current observation, it returns the object directly.
      // @ts-ignore
      const data = res.data || res;
      setConfig(data);
    } catch (error) {
      console.error(error);
      message.error('Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  const getInitialValues = (component: ComponentConfig) => {
    if (component.type === 'ProductCarousel' && Array.isArray(component.props.images)) {
      return {
        ...component.props,
        images: component.props.images.map((url: string) => {
           // Ensure url is a string to avoid TypeError: url.split is not a function in Antd Upload
           const safeUrl = typeof url === 'string' ? url : '';
           return {
               image: safeUrl ? [{
                   uid: `-${Math.random()}`,
                   name: 'image.png',
                   status: 'done',
                   url: safeUrl,
               }] : []
           };
        }),
      };
    }
    return component.props;
  };

  const handleSave = async (values: any) => {
    if (!config || !currentRow) return;

    let finalProps = { ...currentRow.props, ...values };

    // Transform ProductCarousel images from [{image: [...]}] back to string[]
    if (currentRow.type === 'ProductCarousel' && Array.isArray(values.images)) {
       finalProps.images = values.images.map((item: any) => {
           if (item.image && item.image.length > 0) {
               const file = item.image[0];
               if (file.response && file.response.url) {
                   return file.response.url;
               }
               return file.url;
           }
           return null;
       }).filter((url: string | null) => url);
    }

    try {
      // Update the specific component in the list
      const newComponents = config.components.map((comp) => {
        if (comp.id === currentRow.id) {
          return { ...comp, props: finalProps };
        }
        return comp;
      });

      const newConfig = { ...config, components: newComponents };
      await savePortalConfig(newConfig);
      
      setConfig(newConfig);
      setDrawerVisible(false);
      setCurrentRow(undefined);
      message.success('配置保存成功');
      return true;
    } catch (error) {
      message.error('配置保存失败');
      return false;
    }
  };

  const handleSaveAIConfig = async (values: any) => {
    if (!config) return;
    
    // Find Banner component to update its props
    const bannerIndex = config.components.findIndex(c => c.type === 'Banner');
    if (bannerIndex === -1) {
        message.error('未找到 Banner 组件，无法配置 AI 问答');
        return;
    }

    const newComponents = [...config.components];
    const bannerComp = { ...newComponents[bannerIndex] };
    bannerComp.props = {
        ...bannerComp.props,
        knowledge_base_ids: values.knowledge_base_ids
    };
    newComponents[bannerIndex] = bannerComp;

    const newConfig = { ...config, components: newComponents };
    
    try {
        await savePortalConfig(newConfig);
        setConfig(newConfig);
        message.success('AI 问答配置保存成功');
    } catch (error) {
        message.error('保存失败');
    }
  };

  const handleSaveSiteSettings = async (values: any) => {
    if (!config) return;
    const newConfig = { ...config, siteSettings: values };
    try {
        await savePortalConfig(newConfig);
        setConfig(newConfig);
        message.success('站点设置保存成功');
    } catch (error) {
        message.error('保存失败');
    }
  };

  const renderFormFields = (type: string) => {
    switch (type) {
      case 'TopBar':
        return (
          <div>
            <ProFormGroup title="Logo 配置">
              <ProFormText name={['logo', 'text']} label="Logo 文本" width="md" />
              <ProFormText name={['logo', 'src']} label="Logo 图片链接" width="md" />
              <ProFormText name={['logo', 'alt']} label="Logo 替代文本" width="sm" />
            </ProFormGroup>
            <ProFormList name="buttons" label="导航按钮">
              <ProFormGroup key="group">
                <ProFormText name="text" label="按钮文本" width="sm" />
                <ProFormText name="link" label="跳转链接" width="md" />
                <ProFormSelect
                  name="style"
                  label="样式"
                  width="xs"
                  options={[
                    { label: '文本', value: 'text' },
                    { label: '实心', value: 'contained' },
                    { label: '描边', value: 'outlined' },
                  ]}
                />
                <ProFormSelect
                  name="target"
                  label="打开方式"
                  width="xs"
                  options={[
                    { label: '当前窗口', value: '_self' },
                    { label: '新窗口', value: '_blank' },
                  ]}
                />
                <ProFormText name="icon" label="图标名称" width="xs" />
              </ProFormGroup>
            </ProFormList>
          </div>
        );
      case 'Banner':
        return (
          <div>
            <ProFormText name="title" label="标题" width="lg" />
            <ProFormTextArea name="subtitle" label="副标题" width="lg" />
            <ProFormText name="searchPlaceholder" label="搜索框占位符" width="md" />
            <ProFormList name="buttons" label="操作按钮">
              <ProFormGroup key="group">
                <ProFormText name="text" label="文本" width="sm" />
                <ProFormSelect
                  name="type"
                  label="类型"
                  width="xs"
                  options={[
                    { label: '主要', value: 'primary' },
                    { label: '默认', value: 'default' },
                    { label: '链接', value: 'link' },
                  ]}
                />
                <ProFormText name="link" label="链接" width="md" />
              </ProFormGroup>
            </ProFormList>
          </div>
        );
      case 'RecommendedDocs':
        return (
          <div>
            <ProFormText name="title" label="板块标题" width="md" />
            <ProFormList name="items" label="文档列表">
              <ProFormGroup key="group">
                <ProFormText name="title" label="文档标题" width="md" />
                <ProFormTextArea name="summary" label="摘要" width="lg" />
                <ProFormText name="link" label="链接" width="md" />
              </ProFormGroup>
            </ProFormList>
          </div>
        );
      case 'ProductCarousel':
        return (
          <div>
            <ProFormText name="title" label="板块标题" width="md" />
            <ProFormList name="images" label="图片列表">
               {/* @ts-ignore */}
               <ProFormUploadButton
                  name="image"
                  label="上传图片"
                  max={1}
                  fieldProps={{
                      name: 'file',
                      listType: 'picture-card',
                  }}
                  action="/api/v1/upload/image"
               />
            </ProFormList>
          </div>
        );
      case 'FAQ':
        return (
           <div>
            <ProFormText name="title" label="板块标题" width="md" />
            <ProFormList name="items" label="问题列表">
              <ProFormGroup key="group">
                <ProFormText name="question" label="问题" width="md" />
                <ProFormText name="link" label="链接" width="md" />
              </ProFormGroup>
            </ProFormList>
           </div>
        );
       case 'Footer':
        return (
          <div>
             <ProFormGroup title="公司信息">
               <ProFormText name={['logo', 'text']} label="Logo 文本" />
               <ProFormText name="description" label="描述" width="lg" />
             </ProFormGroup>
             <ProFormGroup title="版权信息">
                <ProFormText name={['copyright', 'company']} label="公司名称" />
                <ProFormText name={['copyright', 'icp']} label="ICP 备案号" />
                <ProFormText name={['copyright', 'text']} label="版权文本" />
             </ProFormGroup>
             <ProFormList name="linkGroups" label="链接分组">
                <ProFormText name="name" label="分组名称" />
                <ProFormList name="links" label="链接列表">
                   <ProFormGroup>
                     <ProFormText name="name" label="链接名称" />
                     <ProFormText name="link" label="跳转地址" />
                   </ProFormGroup>
                </ProFormList>
             </ProFormList>
          </div>
        );
      default:
        return <div>该组件暂无可用配置。</div>;
    }
  };

  const componentTypeMap: Record<string, string> = {
    TopBar: '顶部导航栏',
    Banner: '横幅 Banner',
    RecommendedDocs: '推荐文档',
    ProductCarousel: '产品轮播',
    FAQ: '常见问题',
    Footer: '页脚',
    Features: '功能特性',
  };

  const [tab, setTab] = useState('components');

  return (
    <PageContainer 
        title="门户落地页配置" 
        loading={loading}
        extra={[
            <Button key="preview" type="primary" onClick={() => window.open('/portal', '_blank')}>
                跳转门户页面
            </Button>
        ]}
    >
      <ProCard 
        tabs={{
          type: 'card',
          activeKey: tab,
          onChange: setTab,
        }}
      >
        <ProCard.TabPane key="components" tab="组件列表">
          <List
            grid={{ gutter: 16, column: 1 }}
            dataSource={config?.components || []}
            renderItem={(item) => (
              <List.Item>
                <Card 
                  variant="outlined"
                  title={<Space><Tag color="blue">{componentTypeMap[item.type] || item.type}</Tag> {item.id}</Space>} 
                  extra={
                    <Button 
                      type="primary" 
                      onClick={() => {
                        setCurrentRow(item);
                        setDrawerVisible(true);
                      }}
                    >
                      配置
                    </Button>
                  }
                >
                  {/* Brief Preview of Props */}
                  {item.type === 'Banner' && <div style={{color: '#666'}}>标题: {item.props.title}</div>}
                  {item.type === 'TopBar' && <div style={{color: '#666'}}>Logo: {item.props.logo?.text}</div>}
                  {item.type === 'RecommendedDocs' && <div style={{color: '#666'}}>标题: {item.props.title}</div>}
                </Card>
              </List.Item>
            )}
          />
        </ProCard.TabPane>
        
        <ProCard.TabPane key="ai" tab="关联知识库 (AI问答)">
           <div style={{ maxWidth: 800, margin: '24px auto' }}>
              <ProForm
                 submitter={{
                    searchConfig: {
                       submitText: '保存配置',
                    },
                    render: (_, dom) => <div style={{ textAlign: 'center', marginTop: 32 }}>{dom}</div>,
                 }}
                 onFinish={handleSaveAIConfig}
                 initialValues={{ 
                    knowledge_base_ids: config?.components.find(c => c.type === 'Banner')?.props.knowledge_base_ids || [] 
                 }}
                 // Re-initialize form when tab changes or config loads
                 request={async () => {
                    return {
                       knowledge_base_ids: config?.components.find(c => c.type === 'Banner')?.props.knowledge_base_ids || []
                    };
                 }}
              >
                  <ProFormSelect
                      name="knowledge_base_ids"
                      label="关联知识库 (AI问答范围)"
                      tooltip="配置首页 Banner 搜索框发起 AI 问答时，所检索的知识库范围。留空则表示不限制（检索所有有权限的知识库）。"
                      mode="multiple"
                      options={knowledgeBases}
                      placeholder="请选择知识库"
                      rules={[{ required: false }]}
                  />
              </ProForm>
           </div>
        </ProCard.TabPane>
        
        <ProCard.TabPane key="site" tab="站点设置">
           <div style={{ maxWidth: 1000, margin: '24px auto' }}>
              <ProForm
                 submitter={{
                    searchConfig: {
                       submitText: '保存设置',
                    },
                    render: (_, dom) => <div style={{ textAlign: 'center', marginTop: 32 }}>{dom}</div>,
                 }}
                 onFinish={handleSaveSiteSettings}
                 // Use request to ensure data is loaded
                 request={async () => {
                    return config?.siteSettings || {};
                 }}
                 grid={true}
              >
                <ProCard title={<span><ClusterOutlined /> 服务监听方式</span>} headerBordered bordered style={{ marginBottom: 16 }}>
                  <ProFormGroup title="网络监听">
                    <ProFormText name="host" label="域名或 IP" placeholder="0.0.0.0" colProps={{ md: 12, xl: 12 }} />
                    <ProFormRadio.Group
                        name="proxyMode"
                        label="前置反向代理"
                        options={[
                        { label: '无前置反向代理', value: 'none' },
                        { label: '有前置反向代理', value: 'forward' },
                        ]}
                        tooltip="用于修正源 IP 获取错误的问题"
                        colProps={{ md: 12, xl: 12 }}
                    />
                  </ProFormGroup>
                  
                  <Divider style={{ margin: '0 0 24px 0' }} />

                  <ProFormGroup title="协议端口">
                    <ProFormSwitch name="enableHttp" label="启用 HTTP" colProps={{ span: 4 }} />
                    <ProFormDependency name={['enableHttp']}>
                        {({ enableHttp }) => (
                            <ProFormDigit name="httpPort" label="HTTP 端口" disabled={!enableHttp} width="sm" colProps={{ span: 8 }} />
                        )}
                    </ProFormDependency>
                    
                    <ProFormSwitch name="enableHttps" label="启用 HTTPS" colProps={{ span: 4 }} />
                     <ProFormDependency name={['enableHttps']}>
                        {({ enableHttps }) => (
                            <ProFormDigit name="httpsPort" label="HTTPS 端口" disabled={!enableHttps} width="sm" colProps={{ span: 8 }} />
                        )}
                    </ProFormDependency>
                  </ProFormGroup>

                  <ProFormDependency name={['enableHttps']}>
                    {({ enableHttps }) => enableHttps && (
                        <>
                        <Divider style={{ margin: '0 0 24px 0' }} />
                        <ProFormGroup title="SSL 证书配置">
                            <ProFormText name="certFile" label="证书文件路径" placeholder="未选择任何文件" colProps={{ md: 12, xl: 12 }} />
                            <ProFormText name="keyFile" label="私钥文件路径" placeholder="未选择任何文件" colProps={{ md: 12, xl: 12 }} />
                        </ProFormGroup>
                        </>
                    )}
                   </ProFormDependency>
                </ProCard>

                <ProCard title={<span><GlobalOutlined /> 网站基本信息</span>} headerBordered bordered style={{ marginBottom: 16 }}>
                  <ProFormText name="baseUrl" label="网址绝对路径前缀" placeholder="http://11.11.11.11:8000" colProps={{ span: 24 }} />
                  
                  <ProFormGroup title="智能问答版权信息">
                    <ProFormRadio.Group
                      name={['copyright', 'show']}
                      label="版权信息"
                      options={[
                         { label: '显示', value: true },
                         { label: '隐藏', value: false },
                      ]}
                      colProps={{ span: 8 }}
                    />
                    <ProFormText name={['copyright', 'text']} label="版权文字" colProps={{ span: 16 }} placeholder="本网站由 OrgMind 提供技术支持" />
                  </ProFormGroup>
                  
                  <Divider style={{ margin: '0 0 24px 0' }} />
                  
                  <ProFormGroup title="访问控制">
                    <ProFormRadio.Group
                        name="accessControl"
                        label="访问认证"
                        help="配置门户网站的访问权限策略，决定用户是否需要登录才能访问内容。"
                        options={[
                        { label: '完全公开', value: 'public' },
                        { label: '需要认证', value: 'auth' },
                        { label: '禁止访问', value: 'forbidden' },
                        ]}
                        initialValue="public"
                        colProps={{ span: 24 }}
                    />
                  </ProFormGroup>
                </ProCard>

                <ProCard split="vertical" bordered headerBordered style={{ marginBottom: 16 }}>
                    <ProCard title={<span><SearchOutlined /> SEO 设置</span>} colSpan="50%">
                        <ProFormTextArea name={['seo', 'description']} label="网站描述" placeholder="OrgMind 演示站点 - 组织知识库" fieldProps={{ rows: 3 }} />
                        <ProFormText name={['seo', 'keywords']} label="关键词" placeholder="OrgMind, 知识库" />
                    </ProCard>
                    <ProCard title={<span><CodeOutlined /> 自定义代码</span>} colSpan="50%">
                        <ProFormTextArea name={['customCode', 'head']} label="注入到 Head 标签" fieldProps={{ rows: 3 }} placeholder='<link rel="stylesheet" href="/widget-bot.css">' />
                        <ProFormTextArea name={['customCode', 'body']} label="注入到 Body 标签" fieldProps={{ rows: 3 }} />
                    </ProCard>
                </ProCard>
              </ProForm>
           </div>
        </ProCard.TabPane>
      </ProCard>

      <DrawerForm
        key={currentRow?.id}
        title={`配置组件: ${currentRow ? (componentTypeMap[currentRow.type] || currentRow.type) : ''}`}
        open={drawerVisible}
        onOpenChange={setDrawerVisible}
        initialValues={currentRow ? getInitialValues(currentRow) : undefined}
        onFinish={handleSave}
        drawerProps={{
          destroyOnClose: true,
        }}
      >
        {currentRow && renderFormFields(currentRow.type)}
      </DrawerForm>
    </PageContainer>
  );
};

export default PortalConfigPage;
