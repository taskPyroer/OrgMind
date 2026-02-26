import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Tree, Spin, Empty, Button, message, theme, Card, Select } from 'antd';
import { useParams, useSearchParams, history } from '@umijs/max';
import { 
  FolderOutlined, 
  FileTextOutlined, 
  FilePdfOutlined, 
  FileWordOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { getDocuments, getKnowledgeBases } from '@/services/ant-design-pro/rag';
import DocumentContent from '../components/DocumentContent';
import AIChatModal from '@/components/Portal/AIChatModal';
import type { DataNode, TreeProps } from 'antd/es/tree';

const { Sider, Content, Header } = Layout;

const DocumentViewer: React.FC = () => {
  const { kbId } = useParams<{ kbId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const docId = searchParams.get('docId');
  
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  const [kbList, setKbList] = useState<API.KnowledgeBase[]>([]);
  const [kbLoading, setKbLoading] = useState(false);

  const { token } = theme.useToken();

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

  // Load Knowledge Bases
  useEffect(() => {
    const fetchKbs = async () => {
      setKbLoading(true);
      try {
        const { data } = await getKnowledgeBases({ pageSize: 1000 });
        setKbList(data || []);
      } catch (error) {
        message.error('加载知识库列表失败');
      } finally {
        setKbLoading(false);
      }
    };
    fetchKbs();
  }, []);

  // Load root documents
  const loadRootDocuments = useCallback(async () => {
    if (!kbId) return;
    setLoadingTree(true);
    try {
      const { data } = await getDocuments(kbId, { 
        is_root: true, 
        pageSize: 1000 
      });
      const nodes = (data || []).map(doc => mapDocToNode(doc));
      setTreeData(nodes);
    } catch (error) {
      message.error('加载目录失败');
    } finally {
      setLoadingTree(false);
    }
  }, [kbId]);

  useEffect(() => {
    loadRootDocuments();
  }, [loadRootDocuments]);

  const onLoadData: TreeProps['loadData'] = async ({ key, children }) => {
    if (children && children.length > 0) {
      return;
    }
    try {
      const { data } = await getDocuments(kbId!, {
        parent_id: key as string,
        pageSize: 1000
      });
      const childNodes = (data || []).map(doc => mapDocToNode(doc));
      
      setTreeData(origin => updateTreeData(origin, key as string, childNodes));
    } catch (error) {
      message.error('加载子目录失败');
    }
  };

  const updateTreeData = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] => {
    return list.map(node => {
      if (node.key === key) {
        return { ...node, children };
      }
      if (node.children) {
        return { ...node, children: updateTreeData(node.children, key, children) };
      }
      return node;
    });
  };

  const mapDocToNode = (doc: API.Document): DataNode => {
    const isLeaf = !doc.is_folder;
    let icon = <FileTextOutlined />;
    if (doc.is_folder) icon = <FolderOutlined />;
    else if (doc.title?.endsWith('.pdf')) icon = <FilePdfOutlined style={{ color: 'red' }} />;
    else if (doc.title?.endsWith('.docx')) icon = <FileWordOutlined style={{ color: 'blue' }} />;

    return {
      title: doc.title,
      key: doc.id,
      isLeaf,
      icon,
    };
  };

  const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0] as string;
      const node = info.node;
      if (node.isLeaf) {
        setSearchParams({ docId: key });
      } else {
        // If folder, maybe expand? (Default behavior handles expand on icon click)
      }
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ 
        background: token.colorBgContainer, 
        borderBottom: `1px solid ${token.colorSplit}`,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Select
            style={{ width: 250 }}
            value={kbId}
            loading={kbLoading}
            placeholder="切换知识库"
            onChange={(value) => {
              // Switch KB and clear docId
              history.push(`/rag/knowledge-base/${value}/view`);
            }}
            options={kbList.map(kb => ({ label: kb.name, value: kb.id }))}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            showSearch
          />
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            文档浏览
          </span>
        </div>

        <div 
          onClick={() => setChatVisible(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: token.colorFillAlter,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: '6px', // Standard Ant Design border radius
            padding: '0 12px', 
            width: '420px',
            height: '32px', // Match Select height
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = token.colorPrimary;
            e.currentTarget.style.backgroundColor = token.colorBgContainer;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = token.colorBorderSecondary;
            e.currentTarget.style.backgroundColor = token.colorFillAlter;
          }}
        >
          <SearchOutlined style={{ color: token.colorTextSecondary, fontSize: '14px' }} />
          <span style={{ marginLeft: '8px', color: token.colorTextPlaceholder, fontSize: '14px' }}>问问 AI 吧</span>
          
          <div style={{ flex: 1 }} />

          <span style={{ 
            color: token.colorTextDescription, 
            fontSize: '12px', 
            marginRight: '8px',
            fontFamily: token.fontFamily,
          }}>Ctrl+K</span>
          
          <div style={{
            backgroundColor: token.colorBgContainer,
            border: `1px solid ${token.colorSplit}`,
            padding: '0 8px',
            borderRadius: '4px',
            fontSize: '12px',
            color: token.colorText,
            height: '22px',
            display: 'flex',
            alignItems: 'center',
          }}>
            智能问答
          </div>
        </div>
      </Header>
      <Layout>
        <Sider 
          width={300} 
          theme="light" 
          collapsible 
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          style={{ 
            borderRight: `1px solid ${token.colorSplit}`,
            overflow: 'auto',
            height: 'calc(100vh - 64px)'
          }}
        >
          <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {!collapsed && <span style={{ fontWeight: 600 }}>目录</span>}
            <Button 
              type="text" 
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={() => setCollapsed(!collapsed)} 
            />
          </div>
          {!collapsed && (
            loadingTree && treeData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
            ) : (
              <Tree
                showIcon
                blockNode
                loadData={onLoadData}
                treeData={treeData}
                onSelect={onSelect}
                selectedKeys={docId ? [docId] : []}
                style={{ padding: '0 8px' }}
              />
            )
          )}
        </Sider>
        <Content style={{ 
          padding: 24, 
          overflow: 'auto', 
          height: 'calc(100vh - 64px)',
          background: token.colorBgLayout
        }}>
          {docId ? (
             <Card style={{ minHeight: '100%' }}>
                <DocumentContent kbId={kbId!} docId={docId} />
             </Card>
          ) : (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              color: token.colorTextSecondary
            }}>
              <Empty description="请在左侧选择文档进行阅读" />
            </div>
          )}
        </Content>
      </Layout>
      <AIChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        initialQuery=""
        kbIds={kbId ? [kbId] : []}
      />
    </Layout>
  );
};

export default DocumentViewer;
