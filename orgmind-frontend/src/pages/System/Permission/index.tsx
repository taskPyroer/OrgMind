import React, { useRef, useState, useEffect } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, App, Popconfirm, TreeSelect, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getPermissions, createPermission, updatePermission, deletePermission } from '@/services/ant-design-pro/system';
import { ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTreeSelect } from '@ant-design/pro-components';
import { listToTree } from '@/utils/tree';
import { useAccess, Access } from '@umijs/max';

const PermissionList: React.FC = () => {
  const access = useAccess();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const [treeData, setTreeData] = useState<any[]>([]);

  // 获取权限树数据
  const fetchTreeData = async () => {
    try {
      const msg = await getPermissions({});
      const tree = listToTree(msg.data, 'id', 'parent_id', 'children');
      setTreeData(tree);
    } catch (error) {
      console.error('Fetch tree data failed', error);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      fetchTreeData();
    }
  }, [modalVisible]);

  const renderFormFields = () => (
    <>
      <ProFormTreeSelect
        name="parent_id"
        label="上级权限"
        fieldProps={{
          treeData: treeData,
          fieldNames: {
            label: 'name',
            value: 'id',
            children: 'children',
          },
          allowClear: true,
        }}
        placeholder="请选择上级权限（留空为顶级权限）"
      />
      <ProFormText width="md" name="name" label="权限名称" rules={[{ required: true }]} />
      <ProFormText width="md" name="code" label="权限编码" rules={[{ required: true }]} />
      <ProFormSelect
        width="md"
        name="type"
        label="权限类型"
        valueEnum={{
          menu: '菜单',
          button: '按钮',
          api: '接口',
        }}
        initialValue="menu"
        rules={[{ required: true }]}
      />
      <ProFormDigit width="md" name="sort" label="排序" initialValue={0} />
    </>
  );

  const columns: ProColumns<any>[] = [
    {
      title: '权限名称',
      dataIndex: 'name',
    },
    {
      title: '权限编码',
      dataIndex: 'code',
      copyable: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      search: false,
      valueEnum: {
        menu: { text: '菜单', status: 'Processing' },
        button: { text: '按钮', status: 'Success' },
        api: { text: '接口', status: 'Default' },
      },
    },
    {
      title: '排序',
      dataIndex: 'sort',
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Access key="edit" accessible={access.canSystemPermissionEdit}>
          <a
            onClick={() => {
              setCurrentRow(record);
              setModalVisible(true);
            }}
          >
            <EditOutlined /> 编辑
          </a>
        </Access>,
        <Access key="delete" accessible={access.canSystemPermissionDelete}>
          <Popconfirm
            title="确认删除该权限吗？"
            onConfirm={async () => {
              try {
                await deletePermission(record.id);
                message.success('删除成功');
                actionRef.current?.reload();
              } catch (error: any) {
                message.error('删除失败');
              }
            }}
          >
            <a style={{ color: 'red' }}>
              <DeleteOutlined /> 删除
            </a>
          </Popconfirm>
        </Access>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<any>
        headerTitle="权限列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Access key="add" accessible={access.canSystemPermissionAdd}>
            <Button
              type="primary"
              onClick={() => {
                setCurrentRow(undefined);
                setModalVisible(true);
              }}
            >
              <PlusOutlined /> 新建
            </Button>
          </Access>,
        ]}
        request={async (params) => {
          // 获取平铺数据
          const msg = await getPermissions(params);
          // 前端转换为树形结构
          const tree = listToTree(msg.data, 'id', 'parent_id', 'children');
          return {
            data: tree,
            success: msg.success,
          };
        }}
        columns={columns}
        pagination={false}
      />
      
      <ModalForm
        title={currentRow ? '编辑权限' : '新建权限'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await updatePermission(currentRow.id, values);
              message.success('更新成功');
            } else {
              await createPermission(values);
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

export default PermissionList;
