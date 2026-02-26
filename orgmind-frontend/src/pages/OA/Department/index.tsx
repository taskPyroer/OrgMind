import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/services/ant-design-pro/oa';
import { ModalForm, ProFormText, ProFormTreeSelect } from '@ant-design/pro-components';
import { listToTree } from '@/utils/tree';
import { useAccess } from '@umijs/max';

const DepartmentList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const access = useAccess();

  // 统一的表单字段
  const renderFormFields = () => (
    <>
      <ProFormText width="md" name="name" label="部门名称" placeholder="请输入名称" rules={[{ required: true }]} />
      <ProFormText width="md" name="code" label="部门代码" placeholder="请输入代码" />
      <ProFormText width="md" name="leader" label="负责人" placeholder="请输入负责人" />
      <ProFormTreeSelect
        width="md"
        name="parent_id"
        label="上级部门"
        placeholder="请选择上级部门"
        request={async () => {
          // 获取平铺数据
          const result = await getDepartments({ pageSize: 1000, current: 1 });
          const rawData = result.data || [];
          // 转换为树形结构
          const treeData = listToTree(rawData);

          // 递归转换数据格式以适配 TreeSelect
          const loop = (data: any[]): any[] => {
            return data.map((item) => ({
              title: item.name,
              value: item.id,
              disabled: currentRow ? (item.id === currentRow.id) : false, // 编辑时不能选择自己作为父级
              children: item.children ? loop(item.children) : [],
            }));
          };
          return loop(treeData);
        }}
      />
    </>
  );

  const columns: ProColumns<any>[] = [
    {
      title: '部门名称',
      dataIndex: 'name',
    },
    {
      title: '部门代码',
      dataIndex: 'code',
    },
    {
      title: '负责人',
      dataIndex: 'leader',
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        access.canOaDepartmentEdit && (
          <a
            key="edit"
            onClick={() => {
              setCurrentRow(record);
              setModalVisible(true);
            }}
          >
            <EditOutlined /> 编辑
          </a>
        ),
        access.canOaDepartmentDelete && (
          <Popconfirm
            key="delete"
            title="确认删除该部门吗？"
            description="如果有子部门，请先删除或移动子部门。"
            onConfirm={async () => {
              try {
                await deleteDepartment(record.id);
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
          </Popconfirm>
        ),
      ].filter(Boolean),
    },
  ];

  return (
    <PageContainer>
      <ProTable<any>
        headerTitle="部门列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        pagination={false} // 树形数据通常不分页
        expandable={{
          defaultExpandAllRows: true, // 默认展开所有
        }}
        toolBarRender={() => [
          access.canOaDepartmentAdd && (
            <Button
              type="primary"
              key="primary"
              onClick={() => {
                setCurrentRow(undefined);
                setModalVisible(true);
              }}
            >
              <PlusOutlined /> 新建
            </Button>
          ),
        ].filter(Boolean)}
        request={async (params) => {
          // 获取平铺数据
          const result = await getDepartments({ ...params, pageSize: 1000 }); // 部门树形结构需要一次性获取所有数据
          const rawData = result.data || [];
          // 前端转换为树形结构
          const treeData = listToTree(rawData);

          return {
            data: treeData,
            success: true,
          };
        }}
        columns={columns}
      />
      
      {/* 统一使用一个 ModalForm 处理新建和编辑 */}
      <ModalForm
        title={currentRow ? '编辑部门' : '新建部门'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await updateDepartment(currentRow.id, values);
              message.success('更新成功');
            } else {
              await createDepartment(values);
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

export default DepartmentList;
