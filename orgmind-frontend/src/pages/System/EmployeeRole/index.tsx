import React, { useRef, useState, useEffect } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, App, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { getEmployeeAccounts, createEmployeeAccount, updateEmployeeAccount, deleteEmployeeAccount, resetEmployeePassword } from '@/services/ant-design-pro/employeeRole';
import { getEmployees } from '@/services/ant-design-pro/oa';
import { getRoles } from '@/services/ant-design-pro/system';
import { ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { useAccess, Access } from '@umijs/max';

const EmployeeAccountList: React.FC = () => {
  const access = useAccess();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const [roleList, setRoleList] = useState<any[]>([]);
  const [employeeList, setEmployeeList] = useState<any[]>([]);

  // Fetch roles and employees
  const fetchOptions = async () => {
    try {
      const [rolesData, employeesData] = await Promise.all([
        getRoles({ pageSize: 1000 }),
        getEmployees({ pageSize: 1000, status: 'active' }) // Only active employees
      ]);
      // getRoles returns array directly, while getEmployees returns pagination object
      setRoleList(Array.isArray(rolesData) ? rolesData : rolesData?.data || []);
      setEmployeeList(employeesData?.data || []);
    } catch (error) {
      console.error('Fetch options failed', error);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      fetchOptions();
    }
  }, [modalVisible]);

  const columns: ProColumns<any>[] = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
      tooltip: '搜索用户名或职员姓名',
    },
    {
      title: '职员姓名',
      dataIndex: ['employee', 'name'],
      search: false,
      render: (_, record) => record.employee?.name || '-',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      copyable: true,
      search: false,
    },
    {
      title: '所属部门',
      dataIndex: ['employee', 'department', 'name'],
      search: false,
      render: (_, record) => record.employee?.department?.name || '-',
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
              const roleIds = record.roles?.map((r: any) => r.id) || [];
              setCurrentRow({ ...record, role_ids: roleIds });
              setModalVisible(true);
            }}
          >
            <EditOutlined /> 编辑
          </a>
        </Access>,
        <Access key="reset" accessible={access.canSystemUserEdit}>
          <a
            onClick={() => {
              setCurrentRow(record);
              setPasswordModalVisible(true);
            }}
          >
            <KeyOutlined /> 重置密码
          </a>
        </Access>,
        <Access key="delete" accessible={access.canSystemUserDelete}>
          <Popconfirm
            title="确认删除该账号吗？"
            onConfirm={async () => {
              try {
                await deleteEmployeeAccount(record.id);
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
        headerTitle="职员账号列表"
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
              <PlusOutlined /> 新建账号
            </Button>
          </Access>,
        ]}
        request={async (params) => {
          const msg = await getEmployeeAccounts(params);
          return {
            data: msg.data,
            success: true,
            total: msg.total,
          };
        }}
        columns={columns}
      />
      
      <ModalForm
        title={currentRow ? '编辑账号' : '新建账号'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow || { status: 'active' }}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await updateEmployeeAccount(currentRow.id, values);
              message.success('更新成功');
            } else {
              await createEmployeeAccount(values);
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
        {!currentRow && (
            <ProFormSelect
                width="md"
                name="employee_id"
                label="选择职员"
                rules={[{ required: true }]}
                options={employeeList.map(emp => ({ label: `${emp.name} (${emp.phone || emp.email})`, value: emp.id }))}
                fieldProps={{
                    id: 'modal_employee_id',
                    showSearch: true,
                    optionFilterProp: 'label',
                }}
            />
        )}
        
        <ProFormText
          width="md"
          name="username"
          label="用户名"
          rules={[{ required: true }]}
          disabled={!!currentRow}
          placeholder={!currentRow ? "建议使用手机号" : undefined}
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
          fieldProps={{ id: 'modal_status' }}
        />
      </ModalForm>

      <ModalForm
        title="重置密码"
        width="400px"
        open={passwordModalVisible}
        onOpenChange={setPasswordModalVisible}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (value) => {
          if (currentRow) {
            try {
              await resetEmployeePassword(currentRow.id, value);
              message.success('密码重置成功');
              setPasswordModalVisible(false);
            } catch (error) {
              // message handled by request interceptor usually, but safe to add
            }
          }
        }}
      >
        <ProFormText.Password
          name="new_password"
          label="新密码"
          rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少6位' }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default EmployeeAccountList;
