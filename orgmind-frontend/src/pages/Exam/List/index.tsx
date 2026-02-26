import { PlusOutlined, FormOutlined, PlayCircleOutlined, SendOutlined, EditOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTextArea } from '@ant-design/pro-components';
import { Button, message, Tag, Space, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import { history } from 'umi';
import { getExams, generateExam, updateExam, deleteExam } from '@/services/ant-design-pro/exam';
import { getKnowledgeBases } from '@/services/ant-design-pro/rag';

const ExamList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);

  const handlePublish = async (id: string) => {
      try {
          await updateExam(id, { status: 'published' });
          message.success('发布成功');
          actionRef.current?.reload();
      } catch (error) {
          message.error('发布失败');
      }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExam(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<API.Exam>[] = [
    {
      title: '考试名称',
      dataIndex: 'title',
      valueType: 'text',
      render: (dom, entity) => (
        <a onClick={() => history.push(`/exam/taking/${entity.id}`)}>{dom}</a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        draft: { text: '草稿', status: 'Default' },
        published: { text: '已发布', status: 'Success' },
        archived: { text: '已归档', status: 'Error' },
        generating: { text: '生成中', status: 'Processing' },
        failed: { text: '生成失败', status: 'Error' },
      },
    },
    {
      title: '题目数量',
      dataIndex: 'question_count',
      hideInSearch: true,
    },
    {
      title: '及格分',
      dataIndex: 'pass_score',
      hideInSearch: true,
      render: (dom) => `${dom}分`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => {
         if (record.status === 'generating') {
            return <Tag icon={<LoadingOutlined />}>生成中</Tag>;
         }
        
        return (
        <Space>
           {record.status !== 'failed' && (
             <Button 
              type="link" 
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => history.push(`/exam/taking/${record.id}`)}
            >
              开始考试
            </Button>
           )}

          {record.status === 'draft' && (
             <>
                 <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => history.push(`/exam/edit/${record.id}`)}
                 >
                    编辑
                 </Button>
                 <Popconfirm title="确认发布该考试吗？发布后全员可见。" onConfirm={() => handlePublish(record.id)}>
                     <Button 
                   type="link" 
                   size="small"
                   icon={<SendOutlined />}
                >
                   发布
                </Button>
            </Popconfirm>
            <Popconfirm title="确认删除该考试吗？此操作不可恢复。" onConfirm={() => handleDelete(record.id)} okText="删除" okButtonProps={{ danger: true }}>
                <Button 
                   type="link" 
                   size="small"
                   danger
                   icon={<DeleteOutlined />}
                >
                   删除
                </Button>
            </Popconfirm>
        </>
     )}
     
     {record.status === 'failed' && (
        <Popconfirm title="确认删除该考试吗？" onConfirm={() => handleDelete(record.id)} okText="删除" okButtonProps={{ danger: true }}>
            <Button 
               type="link" 
               size="small"
               danger
               icon={<DeleteOutlined />}
            >
               删除
            </Button>
        </Popconfirm>
     )}

     {record.status !== 'failed' && (
     <Button 
             type="link" 
             size="small"
             onClick={() => history.push(`/exam/result/${record.id}`)}
          >
             查看结果
          </Button>
      )}
        </Space>
      )},
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.Exam>
        headerTitle="考试列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            <PlusOutlined /> AI 生成考试
          </Button>,
        ]}
        request={async (params) => {
          const msg = await getExams({
            current: params.current,
            pageSize: params.pageSize,
          });
          return {
            data: msg.data,
            success: msg.success,
            total: msg.total,
          };
        }}
        columns={columns}
      />

      <ModalForm
        title="AI 智能生成考试"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={async (value) => {
          try {
            // 改为异步生成模式
            await generateExam(value as API.ExamGenerateRequest);
            message.success('已提交生成请求，请稍后刷新列表查看状态');
            setCreateModalVisible(false);
            actionRef.current?.reload();
            return true;
          } catch (error) {
            message.error('提交失败，请重试');
            return false;
          }
        }}
      >
        <ProFormText
          name="title"
          label="考试标题"
          placeholder="请输入考试标题"
          rules={[{ required: true }]}
        />
        <ProFormTextArea
          name="description"
          label="考试描述"
          placeholder="请输入描述"
        />
        <ProFormSelect
          name="kb_id"
          label="关联知识库"
          rules={[{ required: true }]}
          request={async () => {
            const res = await getKnowledgeBases({ pageSize: 100 });
            return res.data.map((item) => ({
              label: item.name,
              value: item.id,
            }));
          }}
        />
        <ProFormDigit
          name="question_count"
          label="题目数量"
          min={1}
          max={50}
          initialValue={10}
          fieldProps={{ precision: 0 }}
        />
        <ProFormDigit
          name="duration"
          label="考试时长 (分钟)"
          min={10}
          max={180}
          initialValue={60}
          fieldProps={{ precision: 0 }}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default ExamList;
