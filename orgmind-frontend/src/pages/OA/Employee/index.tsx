import React, { useRef, useState, useEffect } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, App, Popconfirm, Tag, TreeSelect } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getDepartments, getPositions } from '@/services/ant-design-pro/oa';
import { ModalForm, ProFormText, ProFormSelect, ProFormDatePicker, ProFormTreeSelect } from '@ant-design/pro-components';
import { listToTree } from '@/utils/tree';

// Wrapper to handle deprecated props passed by ProTable
const WrappedTreeSelect = (props: any) => {
  const { onDropdownVisibleChange, bordered, ...rest } = props;
  return (
    <TreeSelect
      {...rest}
      variant="outlined"
      onOpenChange={onDropdownVisibleChange || rest.onOpenChange}
    />
  );
};

const EmployeeList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const [departmentTree, setDepartmentTree] = useState<any[]>([]);

  useEffect(() => {
    getDepartments({ pageSize: 1000, current: 1 }).then((res) => {
      const list = (res.data || []).map((item: any) => ({
        title: item.name,
        value: item.id,
        key: item.id,
        id: item.id,
        parent_id: item.parent_id,
      }));
      setDepartmentTree(listToTree(list));
    });
  }, []);


  const columns: ProColumns<any>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      search: false,
      width: 60,
    },
    {
      title: '姓名',
      dataIndex: 'name',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      valueEnum: {
        male: { text: '男', status: 'Default' },
        female: { text: '女', status: 'Default' },
      },
    },
    {
      title: '部门',
      dataIndex: 'department_id', // search parameter name
      renderText: (_, record) => record.department?.name || '-',
      renderFormItem: () => (
        <WrappedTreeSelect
          showSearch
          style={{ width: '100%' }}
          styles={{
            popup: {
              root: { maxHeight: 400, overflow: 'auto' }
            }
          }}
          treeData={departmentTree}
          placeholder="请选择部门"
          allowClear
          treeNodeFilterProp="title"
        />
      ),
    },
    {
      title: '岗位',
      dataIndex: ['position', 'name'],
      search: false, // Position filter not implemented in backend yet, so disable search
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        active: { text: '在职', status: 'Success' },
        left: { text: '离职', status: 'Error' },
        suspended: { text: '停职', status: 'Warning' },
      },
    },
    {
      title: '入职日期',
      dataIndex: 'join_date',
      valueType: 'date',
      search: false,
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
          title="确认删除该职员吗？"
          onConfirm={async () => {
            try {
              await deleteEmployee(record.id);
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
        headerTitle="职员列表"
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
          const result = await getEmployees(params);
          return {
            data: result.data || [],
            total: result.total,
            success: true,
          };
        }}
        columns={columns}
      />
      
      <ModalForm
        title={currentRow ? '编辑职员' : '新建职员'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await updateEmployee(currentRow.id, values);
              message.success('更新成功');
            } else {
              await createEmployee(values);
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
          name="name"
          label="姓名"
          rules={[{ required: true }]}
          fieldProps={{ id: 'modal_name' }}
        />
        <ProFormSelect
          width="md"
          name="gender"
          label="性别"
          valueEnum={{
            male: '男',
            female: '女',
          }}
          initialValue="male"
          fieldProps={{ id: 'modal_gender' }}
        />
        <ProFormText width="md" name="email" label="邮箱" fieldProps={{ id: 'modal_email' }} />
        <ProFormText width="md" name="phone" label="手机号" fieldProps={{ id: 'modal_phone' }} />
        <ProFormSelect
          width="md"
          name="status"
          label="状态"
          valueEnum={{
            active: '在职',
            left: '离职',
            suspended: '停职',
          }}
          initialValue="active"
          fieldProps={{ id: 'modal_status' }}
        />
        <ProFormDatePicker width="md" name="join_date" label="入职日期" fieldProps={{ id: 'modal_join_date' }} />
        <ProFormTreeSelect
          width="md"
          name="department_id"
          label="部门"
          request={async () => {
            const res = await getDepartments({ pageSize: 1000, current: 1 });
            const list = (res.data || []).map((item: any) => ({
              title: item.name,
              value: item.id,
              key: item.id,
              id: item.id,
              parent_id: item.parent_id,
            }));
            return listToTree(list);
          }}
          fieldProps={{
            id: 'modal_department_id',
            showSearch: true,
            treeNodeFilterProp: 'title',
            variant: 'outlined',
            // @ts-ignore
            bordered: undefined,
          }}
        />
        <ProFormSelect
          width="md"
          name="position_id"
          label="岗位"
          request={async () => {
            const res = await getPositions({ pageSize: 1000, current: 1 });
            return (res.data || []).map((item: any) => ({ label: item.name, value: item.id }));
          }}
          fieldProps={{ id: 'modal_position_id' }}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default EmployeeList;
