import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getSalaryItems, createSalaryItem, updateSalaryItem, deleteSalaryItem } from '@/services/ant-design-pro/oa';
import { ModalForm, ProFormText, ProFormSelect, ProFormSwitch } from '@ant-design/pro-components';

const SalaryItemList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();

  const renderFormFields = () => (
    <>
      <ProFormText width="md" name="name" label="名称" rules={[{ required: true }]} />
      <ProFormText width="md" name="code" label="代码" rules={[{ required: true }]} />
      <ProFormSelect
        width="md"
        name="item_type"
        label="类型"
        valueEnum={{
          fixed: '固定',
          variable: '浮动',
          deduction: '扣款',
        }}
        initialValue="fixed"
      />
      <ProFormSwitch name="is_taxable" label="是否纳税" initialValue={true} />
    </>
  );

  const columns: ProColumns<any>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      search: false,
    },
    {
      title: '名称',
      dataIndex: 'name',
    },
    {
      title: '代码',
      dataIndex: 'code',
    },
    {
      title: '类型',
      dataIndex: 'item_type',
      valueEnum: {
        fixed: { text: '固定', status: 'Success' },
        variable: { text: '浮动', status: 'Processing' },
        deduction: { text: '扣款', status: 'Error' },
      },
    },
    {
      title: '是否纳税',
      dataIndex: 'is_taxable',
      valueType: 'select',
      valueEnum: {
        true: { text: '是', status: 'Success' },
        false: { text: '否', status: 'Default' },
      },
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
          title="确认删除该薪酬项吗？"
          onConfirm={async () => {
            try {
              await deleteSalaryItem(record.id);
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
        headerTitle="薪酬项列表"
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
          const result = await getSalaryItems(params);
          return {
            data: result.data || [],
            total: result.total,
            success: true,
          };
        }}
        columns={columns}
      />
      
      <ModalForm
        title={currentRow ? '编辑薪酬项' : '新建薪酬项'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await updateSalaryItem(currentRow.id, values);
              message.success('更新成功');
            } else {
              await createSalaryItem(values);
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

export default SalaryItemList;
