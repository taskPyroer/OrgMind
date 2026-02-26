import { PageContainer, ProTable, type ProColumns } from '@ant-design/pro-components';
import { Button, Tag } from 'antd';
import React from 'react';
import { history } from 'umi';
import { getAllExamResults } from '@/services/ant-design-pro/exam';

const ExamAllResults: React.FC = () => {
  const columns: ProColumns<API.ExamResultListItem>[] = [
    {
      title: '考试名称',
      dataIndex: 'exam_title',
      valueType: 'text',
      copyable: true,
    },
    {
      title: '考生姓名',
      dataIndex: 'user_name',
      valueType: 'text',
    },
    {
      title: '得分',
      dataIndex: 'score',
      valueType: 'digit',
      search: false,
      sorter: (a, b) => a.score - b.score,
      render: (dom, entity) => {
        const color = entity.score >= 60 ? 'green' : 'red';
        return <Tag color={color}>{dom}分</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        in_progress: { text: '进行中', status: 'Processing' },
        completed: { text: '已完成', status: 'Success' },
      },
    },
    {
      title: '提交时间',
      dataIndex: 'submit_time',
      valueType: 'dateTime',
      search: false,
      sorter: (a, b) => {
          const t1 = a.submit_time ? new Date(a.submit_time).getTime() : 0;
          const t2 = b.submit_time ? new Date(b.submit_time).getTime() : 0;
          return t1 - t2;
      },
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          onClick={() => history.push(`/exam/result/${record.id}?type=result_id`)}
        >
          查看详情
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ExamResultListItem>
        headerTitle="全员考试成绩"
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          try {
            const msg = await getAllExamResults({
              ...params,
            });
            return {
              data: Array.isArray(msg.data) ? msg.data : [],
              success: msg.success,
              total: msg.total,
            };
          } catch (error) {
            console.error('Fetch exam results failed:', error);
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
      />
    </PageContainer>
  );
};

export default ExamAllResults;
