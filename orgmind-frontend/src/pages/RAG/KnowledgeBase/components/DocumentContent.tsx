import React, { useEffect, useState } from 'react';
import { Spin, message, Empty } from 'antd';
import { getDocument } from '@/services/ant-design-pro/rag';
import { XMarkdown } from '@ant-design/x-markdown';

interface DocumentContentProps {
  kbId: string;
  docId: string;
  height?: number | string;
}

const DocumentContent: React.FC<DocumentContentProps> = ({ kbId, docId, height = '100%' }) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    if (kbId && docId) {
      loadDocument();
    }
  }, [kbId, docId]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const doc = await getDocument(kbId, docId);
      setContent(doc.content || '*暂无内容*');
      setTitle(doc.title);
    } catch (error) {
      message.error('加载文档内容失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Spin size="large" />
        <div style={{ marginTop: 8, color: 'rgba(0, 0, 0, 0.45)' }}>加载文档中...</div>
      </div>
    );
  }

  if (!content) {
    return <Empty description="请选择文档" style={{ marginTop: 100 }} />;
  }

  return (
    <div style={{ height, overflowY: 'auto', padding: '0 16px' }}>
      <h2 style={{ marginBottom: 24, borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
        {title}
      </h2>
      <XMarkdown content={content} />
    </div>
  );
};

export default DocumentContent;
