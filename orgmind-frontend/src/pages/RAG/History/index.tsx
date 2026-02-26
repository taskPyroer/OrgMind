import React, { useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Tag, Button, Modal, Typography, Space } from 'antd';
import { getAllChatHistory, deleteChatHistory } from '@/services/ant-design-pro/rag';
import { XMarkdown } from '@ant-design/x-markdown';

const { Paragraph } = Typography;

const ChatHistoryPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.ChatHistory>();
  const [detailVisible, setDetailVisible] = useState<boolean>(false);

  const columns: ProColumns<API.ChatHistory>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: '问题',
      dataIndex: 'question',
      ellipsis: true,
      copyable: true,
      width: 200,
    },
    {
      title: '回答',
      dataIndex: 'answer',
      ellipsis: true,
      search: false,
      render: (_, record) => (
        <a
          onClick={() => {
            setCurrentRow(record);
            setDetailVisible(true);
          }}
        >
          查看详情
        </a>
      ),
    },
    {
      title: '来源平台',
      dataIndex: 'source_platform',
      valueEnum: {
        internal: { text: '内部管理平台', status: 'Processing' },
        portal: { text: '知识库门户', status: 'Success' },
      },
      width: 120,
    },
    {
        title: '来源 IP',
        dataIndex: 'ip_address',
        search: false,
        width: 130,
        render: (_, record) => (
            <Space direction="vertical" size={0}>
                <span>{record.ip_address || '-'}</span>
                <span style={{ fontSize: 12, color: '#999' }}>{record.ip_location || ''}</span>
            </Space>
        )
    },
    {
      title: '提问时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      width: 160,
      search: false,
      sorter: true,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <a
          key="delete"
          onClick={async () => {
            Modal.confirm({
              title: '确认删除',
              content: '确定要删除这条对话记录吗？',
              onOk: async () => {
                try {
                  await deleteChatHistory(record.id.toString());
                  actionRef.current?.reload();
                } catch (error) {
                  console.error(error);
                }
              },
            });
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ChatHistory>
        headerTitle="对话历史记录列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params, sort, filter) => {
          const msg = await getAllChatHistory({
            current: params.current,
            pageSize: params.pageSize,
            ...params,
          });
          return {
            data: msg.data,
            success: msg.success,
            total: msg.total,
          };
        }}
        columns={columns}
      />
      <Modal
        title="对话详情"
        width={800}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
      >
        {currentRow && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Tag color="blue">问题</Tag>
              <Paragraph style={{ marginTop: 8 }}>{currentRow.question}</Paragraph>
            </div>
            <div>
              <Tag color="green">回答</Tag>
              <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <XMarkdown>{currentRow.answer}</XMarkdown>
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
                <Space>
                    <span>来源: {currentRow.source_platform === 'internal' ? '内部管理平台' : '知识库门户'}</span>
                    <span>IP: {currentRow.ip_address}</span>
                    <span>时间: {currentRow.created_at}</span>
                </Space>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default ChatHistoryPage;
