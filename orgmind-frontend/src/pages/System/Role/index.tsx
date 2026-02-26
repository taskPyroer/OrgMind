import React, { useRef, useState, useEffect } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, App, Popconfirm, Tag, TreeSelect } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getRoles, createRole, updateRole, deleteRole, getPermissions } from '@/services/ant-design-pro/system';
import { ModalForm, ProFormText, ProFormTextArea, ProFormSelect, ProFormTreeSelect } from '@ant-design/pro-components';
import { listToTree } from '@/utils/tree';
import { useAccess, Access } from '@umijs/max';

const RoleList: React.FC = () => {
  const access = useAccess();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const [permissionTree, setPermissionTree] = useState<any[]>([]);

  // 获取权限树数据
  const fetchPermissionTree = async () => {
    try {
      const data = await getPermissions({});
      const tree = listToTree(data, 'id', 'parent_id', 'children');
      setPermissionTree(tree);
    } catch (error) {
      console.error('Fetch permission tree failed', error);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      fetchPermissionTree();
    }
  }, [modalVisible]);

  const renderFormFields = () => (
    <>
      <ProFormText width="md" name="name" label="角色名称" rules={[{ required: true }]} />
      <ProFormText width="md" name="code" label="角色编码" rules={[{ required: true }]} />
      <ProFormSelect
        width="md"
        name="status"
        label="状态"
        valueEnum={{
          active: '正常',
          inactive: '停用',
        }}
        initialValue="active"
      />
      <ProFormTreeSelect
        name="permission_ids"
        label="角色权限"
        fieldProps={{
          treeData: permissionTree,
          fieldNames: {
            label: 'name',
            value: 'id',
            children: 'children',
          },
          treeCheckable: true,
          showCheckedStrategy: TreeSelect.SHOW_ALL,
          placeholder: '请选择权限',
          maxTagCount: 10,
        }}
      />
      <ProFormTextArea width="md" name="remark" label="备注" />
    </>
  );

  const columns: ProColumns<any>[] = [
    {
      title: '角色编码',
      dataIndex: 'code',
      copyable: true,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        active: { text: '正常', status: 'Success' },
        inactive: { text: '停用', status: 'Error' },
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
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
        <Access key="edit" accessible={access.canSystemRoleEdit}>
          <a
            onClick={() => {
              // 处理权限ID列表，后端返回的是对象列表，前端表单需要ID列表
              const permissionIds = record.permissions?.map((p: any) => p.id) || [];
              setCurrentRow({ ...record, permission_ids: permissionIds });
              setModalVisible(true);
            }}
          >
            <EditOutlined /> 编辑
          </a>
        </Access>,
        <Access key="delete" accessible={access.canSystemRoleDelete}>
          <Popconfirm
            title="确认删除该角色吗？"
            onConfirm={async () => {
              try {
                await deleteRole(record.id);
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
        headerTitle="角色列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Access key="add" accessible={access.canSystemRoleAdd}>
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
          const msg = await getRoles(params);
          return {
            data: msg.data,
            success: msg.success,
            total: msg.total,
          };
        }}
        columns={columns}
      />
      
      <ModalForm
        title={currentRow ? '编辑角色' : '新建角色'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await updateRole(currentRow.id, values);
              message.success('更新成功');
            } else {
              await createRole(values);
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

export default RoleList;
