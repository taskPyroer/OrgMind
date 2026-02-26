import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getPositions, createPosition, updatePosition, deletePosition } from '@/services/ant-design-pro/oa';
import { ModalForm, ProFormText, ProFormDigit, ProFormTextArea } from '@ant-design/pro-components';

const PositionList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();

  const renderFormFields = () => (
    <>
      <ProFormText width="md" name="name" label="岗位名称" rules={[{ required: true }]} />
      <ProFormDigit width="md" name="level" label="级别" initialValue={1} />
      <ProFormTextArea width="md" name="description" label="描述" />
    </>
  );

  const columns: ProColumns<any>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      search: false,
      width: 80,
    },
    {
      title: '岗位名称',
      dataIndex: 'name',
    },
    {
      title: '级别',
      dataIndex: 'level',
      valueType: 'digit',
      search: false,
    },
    {
      title: '描述',
      dataIndex: 'description',
      search: false,
      ellipsis: true,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setCurrentRow(record);
            setModalVisible(true);
          }}
        >
          <EditOutlined /> 编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该岗位吗？"
          description="如果该岗位下有员工，删除将失败。"
          onConfirm={async () => {
            try {
              await deletePosition(record.id);
              message.success('删除成功');
              actionRef.current?.reload();
            } catch (error: any) {
              message.error('删除失败: ' + (error.response?.data?.detail || '未知错误'));
            }
          }}
        >
          <a key="delete" style={{ color: 'red' }}>
            <DeleteOutlined /> 删除
          </a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<any>
        headerTitle="岗位列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setCurrentRow(undefined);
              setModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={async (params) => {
          const result = await getPositions(params);
          return {
            data: result.data || [],
            total: result.total,
            success: true,
          };
        }}
        columns={columns}
      />
      
      <ModalForm
        title={currentRow ? '编辑岗位' : '新建岗位'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await updatePosition(currentRow.id, values);
              message.success('更新成功');
            } else {
              await createPosition(values);
              message.success('创建成功');
            }
            setModalVisible(false);
            actionRef.current?.reload();
            return true;
          } catch (error: any) {
            message.error('提交失败: ' + (error.response?.data?.detail || '未知错误'));
            return false;
          }
        }}
      >
        {renderFormFields()}
      </ModalForm>
    </PageContainer>
  );
};

export default PositionList;
