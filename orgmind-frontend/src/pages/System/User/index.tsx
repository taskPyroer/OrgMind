import React, { useRef, useState, useEffect } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, App, Popconfirm, Tag, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser, getRoles } from '@/services/ant-design-pro/system';
import { ModalForm, ProFormText, ProFormSelect, ProFormSwitch } from '@ant-design/pro-components';
import { useAccess, Access } from '@umijs/max';

const UserList: React.FC = () => {
  const access = useAccess();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const [roleList, setRoleList] = useState<any[]>([]);

  // 获取角色列表用于下拉选择
  const fetchRoles = async () => {
    try {
      const msg = await getRoles({ pageSize: 1000 });
      setRoleList(msg.data);
    } catch (error) {
      console.error('Fetch roles failed', error);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      fetchRoles();
    }
  }, [modalVisible]);


  const columns: ProColumns<any>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      copyable: true,
    },
    {
      title: '姓名',
      dataIndex: 'full_name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      search: false,
      render: (_, record) => (
        <>
          {record.roles?.map((role: any) => (
            <Tag key={role.id} color="blue">{role.name}</Tag>
          ))}
        </>
      ),
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
      title: '管理员',
      dataIndex: 'is_superuser',
      search: false,
      render: (dom, record) => {
        return record.is_superuser ? <Tag color="gold">是</Tag> : <Tag>否</Tag>;
      },
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
        <Access key="edit" accessible={access.canSystemUserEdit}>
          <a
            onClick={() => {
              // 处理角色ID列表
              const roleIds = record.roles?.map((r: any) => r.id) || [];
              setCurrentRow({ ...record, role_ids: roleIds });
              setModalVisible(true);
            }}
          >
            <EditOutlined /> 编辑
          </a>
        </Access>,
        <Access key="delete" accessible={access.canSystemUserDelete}>
          <Popconfirm
            title="确认删除该用户吗？"
            onConfirm={async () => {
              try {
                await deleteUser(record.id);
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
        headerTitle="用户列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Access key="add" accessible={access.canSystemUserAdd}>
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
          const { full_name, ...rest } = params;
          const msg = await getUsers({ ...rest, name: full_name });
          return {
            data: msg.data,
            success: msg.success,
            total: msg.total,
          };
        }}
        columns={columns}
      />
      
      <ModalForm
        title={currentRow ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await updateUser(currentRow.id, values);
              message.success('更新成功');
            } else {
              await createUser(values);
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
        <ProFormText
          width="md"
          name="username"
          label="用户名"
          rules={[{ required: true }]}
          disabled={!!currentRow}
          fieldProps={{ id: 'modal_username' }}
        />
        {!currentRow && (
          <ProFormText.Password
            width="md"
            name="password"
            label="密码"
            rules={[{ required: true }]}
            fieldProps={{ id: 'modal_password' }}
          />
        )}
        {currentRow && (
          <ProFormText.Password
            width="md"
            name="password"
            label="重置密码"
            placeholder="留空则不修改"
            fieldProps={{ id: 'modal_reset_password' }}
          />
        )}
        <ProFormText width="md" name="full_name" label="姓名" fieldProps={{ id: 'modal_full_name' }} />
        <ProFormText width="md" name="email" label="邮箱" rules={[{ type: 'email' }]} fieldProps={{ id: 'modal_email' }} />
        <ProFormSelect
          width="md"
          name="role_ids"
          label="角色"
          mode="multiple"
          options={roleList.map(role => ({ label: role.name, value: role.id }))}
          fieldProps={{ id: 'modal_role_ids' }}
        />
        <ProFormSelect
          width="md"
          name="status"
          label="状态"
          valueEnum={{
            active: '正常',
            inactive: '停用',
          }}
          initialValue="active"
          fieldProps={{ id: 'modal_status' }}
        />
        <ProFormSwitch
          name="is_superuser"
          label="是否超级管理员"
          initialValue={false}
          fieldProps={{ id: 'modal_is_superuser' }}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default UserList;
