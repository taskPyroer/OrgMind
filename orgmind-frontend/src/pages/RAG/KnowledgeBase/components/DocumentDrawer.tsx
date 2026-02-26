import React, { useRef, useState, useEffect } from 'react';
import { Button, Drawer, message, Upload, Popconfirm, Space, Card, Modal, Input, Form, Empty, Spin } from 'antd';
import { 
  UploadOutlined, 
  DeleteOutlined, 
  InboxOutlined, 
  FilePdfOutlined, 
  FileWordOutlined, 
  FileTextOutlined,
  FolderOutlined,
  FolderAddOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { getDocuments, createDocument, deleteDocument, createFolder } from '@/services/ant-design-pro/rag';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import type { DataNode } from 'antd/es/tree';

const { Dragger } = Upload;

type DocumentDrawerProps = {
  open: boolean;
  onClose: () => void;
  kbId: string;
  kbName: string;
};

const DocumentDrawer: React.FC<DocumentDrawerProps> = ({ open, onClose, kbId, kbName }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const actionRef =  useRef<ActionType>(null);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<RcFile[]>([]);

  // Folder state
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [folderForm] = Form.useForm();
  
  // Main tree data state
  const [documentTree, setDocumentTree] = useState<API.Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [polling, setPolling] = useState(false);

  // Load root documents on open
  useEffect(() => {
    if (open && kbId) {
      loadRootDocuments();
      setPolling(false);
    } else {
      setPolling(false);
    }
  }, [open, kbId]);

  // Polling effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (polling) {
        timer = setInterval(async () => {
            // We only refresh the current upload target or root
            // If we have a currentFolderId, refresh that. Else refresh root.
            try {
                let hasPending = false;
                
                if (currentFolderId) {
                    const children = await fetchChildren(currentFolderId);
                    // Check if any child is pending/processing
                    hasPending = children.some(d => d.status === 'pending' || d.status === 'processing');
                    setDocumentTree(prev => updateTreeData(prev, currentFolderId, children));
                } else {
                    // Refresh root
                    const { data } = await getDocuments(kbId, { 
                        is_root: true, 
                        pageSize: 1000 
                    });
                    const processedData = (data || []).map(doc => ({
                        ...doc,
                        children: doc.is_folder ? [] : undefined,
                        isLeaf: !doc.is_folder
                    }));
                    hasPending = (data || []).some(d => d.status === 'pending' || d.status === 'processing');
                    
                    // Merge strategy:
                    // 1. Create map of old children
                    // 2. Map new data, if id exists in old and has children, keep them.
                    setDocumentTree(prev => {
                        const oldMap = new Map(prev.map(p => [p.id, p.children]));
                        return processedData.map(newDoc => {
                            if (oldMap.has(newDoc.id)) {
                                const oldChildren = oldMap.get(newDoc.id);
                                if (oldChildren && oldChildren.length > 0) {
                                    return { ...newDoc, children: oldChildren };
                                }
                            }
                            return newDoc;
                        });
                    });
                }
                
                if (!hasPending) {
                    setPolling(false);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 3000);
    }
    return () => {
        if (timer) clearInterval(timer);
    };
  }, [polling, currentFolderId, kbId]);

  const loadRootDocuments = async () => {
    setLoading(true);
    try {
      const { data } = await getDocuments(kbId, { 
        is_root: true, 
        pageSize: 1000 // Load more to show full structure
      });
      // Add 'children' property to folders to make them expandable
      const processedData = (data || []).map(doc => ({
        ...doc,
        children: doc.is_folder ? [] : undefined, // Empty array enables expand icon
        isLeaf: !doc.is_folder
      }));
      setDocumentTree(processedData);
    } catch (error) {
      messageApi.error('加载文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async (parentId: string) => {
    const { data } = await getDocuments(kbId, {
        parent_id: parentId,
        pageSize: 1000
    });
    
    return (data || []).map(doc => ({
        ...doc,
        children: doc.is_folder ? [] : undefined,
        isLeaf: !doc.is_folder
    }));
  };

  const refreshNode = async (key: string) => {
      try {
          const children = await fetchChildren(key);
          setDocumentTree(prev => updateTreeData(prev, key, children));
      } catch (error) {
          messageApi.error('刷新目录失败');
      }
  };

  const onExpand = async (expanded: boolean, record: API.Document) => {
    if (expanded && record.is_folder) {
       // Always fetch to ensure fresh data, or check if children are empty
       // If we want to support dynamic updates, better to fetch if empty or force refresh
       if (!record.children || record.children.length === 0) {
           try {
             const children = await fetchChildren(record.id);
             setDocumentTree(prev => updateTreeData(prev, record.id, children));
           } catch (error) {
             messageApi.error('加载子目录失败');
           }
       }
    }
  };

  const updateTreeData = (list: API.Document[], key: string, children: API.Document[]): API.Document[] => {
    return list.map(node => {
      if (node.id === key) {
        return { ...node, children };
      }
      if (node.children) {
        return { ...node, children: updateTreeData(node.children as API.Document[], key, children) };
      }
      return node;
    });
  };

  const handleCreateFolder = async (values: { title: string }) => {
    try {
      await createFolder(kbId, {
        title: values.title,
        kb_id: kbId,
        parent_id: currentFolderId
      });
      messageApi.success('文件夹创建成功');
      setCreateFolderVisible(false);
      folderForm.resetFields();
      
      if (currentFolderId) {
          await refreshNode(currentFolderId);
          // Ensure the folder is expanded
          if (!expandedRowKeys.includes(currentFolderId)) {
              setExpandedRowKeys(prev => [...prev, currentFolderId]);
          }
      } else {
          loadRootDocuments();
      }
    } catch (error) {
      messageApi.error('创建失败');
    }
  };
  
  // Helper to find node
  const findNode = (nodes: API.Document[], key: string): API.Document | undefined => {
      for (const node of nodes) {
          if (node.id === key) return node;
          if (node.children) {
              const found = findNode(node.children as API.Document[], key);
              if (found) return found;
          }
      }
      return undefined;
  };


  const columns: ProColumns<API.Document>[] = [
    {
      title: '文档标题',
      dataIndex: 'title',
      render: (dom, record) => {
        if (record.is_folder) {
          return (
            <Space style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => {
                // Toggle expand
                const isExpanded = expandedRowKeys.includes(record.id);
                if (isExpanded) {
                    setExpandedRowKeys(prev => prev.filter(k => k !== record.id));
                } else {
                    setExpandedRowKeys(prev => [...prev, record.id]);
                    onExpand(true, record);
                }
            }}>
              <FolderOutlined style={{ fontSize: 18 }} />
              <span style={{ fontWeight: 500 }}>{dom}</span>
            </Space>
          );
        }
        
        let icon = <FileTextOutlined />;
        if (record.title?.endsWith('.pdf')) icon = <FilePdfOutlined style={{ color: 'red' }} />;
        if (record.title?.endsWith('.docx')) icon = <FileWordOutlined style={{ color: 'blue' }} />;
        return <Space>{icon}{dom}</Space>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        pending: { text: '等待中', status: 'Default' },
        processing: { text: '处理中', status: 'Processing' },
        completed: { text: '已完成', status: 'Success' },
        failed: { text: '失败', status: 'Error' },
        skipped: { text: '已跳过', status: 'Warning' }, 
      },
      render: (dom, record) => {
        if (record.is_folder) return '-';
        return dom;
      }
    },
    {
      title: '上传人',
      dataIndex: 'creator',
      width: 120,
      render: (_, record) => {
        if (record.creator) {
            return record.creator.name || record.creator.username;
        }
        return '-';
      },
      hideInSearch: true,
    },
    {
      title: '分块数',
      dataIndex: 'chunk_count',
      width: 80,
      hideInSearch: true,
      render: (dom, record) => {
        if (record.is_folder) return '-';
        return dom;
      }
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      width: 160,
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        !record.is_folder && (
            <Button 
                key="view" 
                type="link" 
                icon={<EyeOutlined />} 
                size="small"
                onClick={() => {
                    // Open in new window/tab
                    window.open(`/rag/knowledge-base/${kbId}/view?docId=${record.id}`, '_blank');
                }}
            >
                预览
            </Button>
        ),
        <Popconfirm
          key="delete"
          title={`确定要删除此${record.is_folder ? '文件夹' : '文档'}吗？`}
          description={record.is_folder ? "删除文件夹将同时删除其中所有内容，且无法恢复。" : "删除后将无法恢复，且会从向量库中移除。"}
          onConfirm={async () => {
            try {
              await deleteDocument(kbId, record.id);
              message.success('删除成功');
              // Refresh both
              if (currentFolderId) {
                  // If we are deleting something inside the current selection or just generally
                  // Wait, currentFolderId is the UPLOAD target.
                  // We need to refresh the PARENT of the deleted node.
                  // Since we don't track parent directly in the node (we could but API might not return it),
                  // we can try to find parent in tree or just refresh root if we can't find it.
                  // BUT, the API result `record.parent_id` is available if the backend sends it.
                  if (record.parent_id) {
                      await refreshNode(record.parent_id);
                  } else {
                      loadRootDocuments();
                  }
              } else {
                 // If currentFolderId is null, we might still be deleting a child node.
                 if (record.parent_id) {
                      await refreshNode(record.parent_id);
                 } else {
                      loadRootDocuments();
                 }
              }
            } catch (error) {
              message.error('删除失败');
            }
          }}
        >
          <Button type="link" danger icon={<DeleteOutlined />} size="small">
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const handleUpload = async () => {
    if (fileList.length === 0) {
      messageApi.warning('请先选择文件');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append('files', file);
    });
    
    if (currentFolderId) {
      formData.append('parent_id', currentFolderId);
    }
    
    try {
      await createDocument(kbId, formData);
      messageApi.success('批量上传成功，正在后台处理...');
      setFileList([]);
      
      // Refresh
      if (currentFolderId) {
          await refreshNode(currentFolderId);
          // Ensure expanded
          if (!expandedRowKeys.includes(currentFolderId)) {
             setExpandedRowKeys(prev => [...prev, currentFolderId]);
          }
      } else {
          loadRootDocuments();
      }
      
      // Start polling
      setPolling(true);
      
    } catch (error) {
      messageApi.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file as RcFile);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList((prev) => [...prev, file]);
      return false;
    },
    fileList,
    multiple: true,
  };

  return (
    <Drawer
      width={1200}
      title={`文档管理 - ${kbName}`}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{ body: { padding: 0 } }}
    >
      {contextHolder}
      <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Card style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
            <Dragger {...uploadProps} style={{ padding: 20, border: 'none' }}>
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
            <p className="ant-upload-hint">
                {currentFolderId 
                    ? `上传至: ${findNode(documentTree, currentFolderId)?.title || '未知目录'}` 
                    : '上传至: 根目录 (可在下方列表中勾选文件夹以切换上传目标)'}
            </p>
            </Dragger>
            {fileList.length > 0 && (
            <div style={{ textAlign: 'right', padding: '10px 20px', borderTop: '1px solid #f0f0f0' }}>
                <Button 
                    type="primary" 
                    onClick={handleUpload} 
                    loading={uploading}
                    icon={<UploadOutlined />}
                >
                    {uploading ? '上传中...' : `开始上传 (${fileList.length}个文件)`}
                </Button>
            </div>
            )}
        </Card>

        <ProTable<API.Document>
            headerTitle="文档内容"
            actionRef={actionRef}
            rowKey="id"
            search={false}
            options={false}
            dataSource={documentTree}
            loading={loading}
            pagination={false}
            toolBarRender={() => [
                <Button 
                    key="create_folder" 
                    icon={<FolderAddOutlined />} 
                    onClick={() => setCreateFolderVisible(true)}
                >
                    新建文件夹
                </Button>,
                <Button 
                    key="refresh" 
                    onClick={() => loadRootDocuments()}
                >
                    刷新
                </Button>
            ]}
            expandable={{
                expandedRowKeys,
                onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as React.Key[]),
                onExpand: onExpand,
                expandRowByClick: true, // Click anywhere to expand? Maybe not if we have actions. 
                // Let's keep default expand icon.
            }}
            rowSelection={{
                type: 'radio',
                selectedRowKeys: currentFolderId ? [currentFolderId] : [],
                onChange: (keys) => {
                    const key = keys[0] as string;
                    // Only allow selecting folders
                    const node = findNode(documentTree, key);
                    if (node?.is_folder) {
                        setCurrentFolderId(key);
                    } else {
                        setCurrentFolderId(undefined);
                    }
                },
                getCheckboxProps: (record) => ({
                    disabled: !record.is_folder, // Disable selection for files
                }),
            }}
            columns={columns}
        />
      </div>

      <Modal
        title="新建文件夹"
        open={createFolderVisible}
        onOk={() => folderForm.submit()}
        onCancel={() => {
          setCreateFolderVisible(false);
          folderForm.resetFields();
        }}
      >
        <Form form={folderForm} onFinish={handleCreateFolder}>
          <Form.Item
            name="title"
            label="文件夹名称"
            rules={[{ required: true, message: '请输入文件夹名称' }]}
          >
            <Input placeholder="请输入文件夹名称" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </Drawer>
  );
};

export default DocumentDrawer;
