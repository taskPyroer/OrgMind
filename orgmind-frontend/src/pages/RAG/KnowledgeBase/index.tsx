import React, { useState, useRef } from 'react';
import { Button, message, Popconfirm, Tooltip } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { ModalForm, ProFormText, ProFormSelect, ProFormTextArea, ProFormDependency, ProFormTreeSelect } from '@ant-design/pro-form';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getKnowledgeBases, createKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase } from '@/services/ant-design-pro/rag';
import { getDepartments } from '@/services/ant-design-pro/oa';
import { listToTree } from '@/utils/tree';
import DocumentDrawer from './components/DocumentDrawer';

const KnowledgeBaseList: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const actionRef =  useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.KnowledgeBase>();
  const [docDrawerVisible, setDocDrawerVisible] = useState<boolean>(false);

  const handleCreate = async (values: API.KnowledgeBase) => {
    try {
      await createKnowledgeBase(values);
      messageApi.success('创建成功');
      setCreateModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      messageApi.error('创建失败');
      return false;
    }
  };

  const handleUpdate = async (values: API.KnowledgeBase) => {
    if (!currentRow) return false;
    try {
      await updateKnowledgeBase(currentRow.id, values);
      messageApi.success('更新成功');
      setUpdateModalVisible(false);
      setCurrentRow(undefined);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      messageApi.error('更新失败');
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteKnowledgeBase(id);
      messageApi.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      messageApi.error('删除失败');
    }
  };

  const columns: ProColumns<API.KnowledgeBase>[] = [
    {
      title: '名称',
      dataIndex: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      hideInSearch: true,
    },
    {
      title: '可见性',
      dataIndex: 'visibility',
      valueEnum: {
        private: { text: '私有', status: 'Default' },
        department: { text: '部门可见', status: 'Processing' },
        public: { text: '全员公开', status: 'Success' },
      },
      render: (dom, record) => {
        if (record.visibility === 'department' && record.visible_departments && record.visible_departments.length > 0) {
          const deptNames = record.visible_departments.map((d) => d.name).join(', ');
          return (
            <Tooltip title={deptNames}>
              <span>{dom}</span>
            </Tooltip>
          );
        }
        return dom;
      },
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      render: (_, record) => {
        if (record.creator) {
            return record.creator.name || record.creator.username;
        }
        return '-';
      },
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Button
          type="link"
          key="docs"
          style={{ padding: 0 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentRow(record);
            setDocDrawerVisible(true);
          }}
        >
          文档管理
        </Button>,
        <Button
          type="link"
          key="edit"
          style={{ padding: 0 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentRow(record);
            setUpdateModalVisible(true);
          }}
        >
          <EditOutlined /> 编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除此知识库吗？"
          description="删除后将无法恢复，且会清空所有相关文档。"
          onConfirm={() => handleDelete(record.id)}
          onCancel={(e) => {
            e?.preventDefault();
            e?.stopPropagation();
          }}
        >
          <Button type="link" danger style={{ padding: 0 }}>
            <DeleteOutlined /> 删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<API.KnowledgeBase>
        headerTitle="知识库列表"
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
              setCreateModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={async (params) => {
          const result = await getKnowledgeBases({
            ...params,
            current: params.current,
            pageSize: params.pageSize,
            // @ts-ignore
            name: params.name,
            // @ts-ignore
            visibility: params.visibility,
          });
          return {
            data: result.data || [],
            success: result.success,
            total: result.total,
          };
        }}
        columns={columns}
      />

      <ModalForm
        title="新建知识库"
        width="400px"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
      >
        <ProFormText
          rules={[{ required: true, message: '请输入名称' }]}
          name="name"
          label="名称"
        />
        <ProFormTextArea name="description" label="描述" />
        <ProFormSelect
          options={[
            { value: 'private', label: '私有' },
            { value: 'department', label: '部门可见' },
            { value: 'public', label: '全员公开' },
          ]}
          name="visibility"
          label="可见性"
          initialValue="private"
        />
        <ProFormDependency name={['visibility']}>
          {({ visibility }) => {
            if (visibility === 'department') {
              return (
                <ProFormTreeSelect
                  name="visible_department_ids"
                  label="选择部门"
                  placeholder="请选择可见部门"
                  rules={[{ required: true, message: '请选择部门' }]}
                  fieldProps={{
                    treeCheckable: true,
                    showCheckedStrategy: 'SHOW_PARENT',
                    treeNodeFilterProp: 'title',
                    variant: 'outlined',
                    // @ts-ignore
                    bordered: undefined,
                    fieldNames: {
                      label: 'title',
                      value: 'value',
                    },
                  }}
                  request={async () => {
                    const result = await getDepartments({ pageSize: 1000 });
                    const list = result?.data || (Array.isArray(result) ? result : []);
                    const treeData = list.map((item: any) => ({
                      title: item.name,
                      value: item.id,
                      id: item.id,
                      parent_id: item.parent_id,
                      key: item.id,
                    }));
                    return listToTree(treeData);
                  }}
                />
              );
            }
            return null;
          }}
        </ProFormDependency>
      </ModalForm>

      <ModalForm
        title="编辑知识库"
        width="400px"
        open={updateModalVisible}
        onOpenChange={setUpdateModalVisible}
        onFinish={handleUpdate}
        initialValues={currentRow}
      >
        <ProFormText
          rules={[{ required: true, message: '请输入名称' }]}
          name="name"
          label="名称"
        />
        <ProFormTextArea name="description" label="描述" />
        <ProFormSelect
          options={[
            { value: 'private', label: '私有' },
            { value: 'department', label: '部门可见' },
            { value: 'public', label: '全员公开' },
          ]}
          name="visibility"
          label="可见性"
        />
        <ProFormDependency name={['visibility']}>
          {({ visibility }) => {
            if (visibility === 'department') {
              return (
                <ProFormTreeSelect
                  name="visible_department_ids"
                  label="选择部门"
                  placeholder="请选择可见部门"
                  rules={[{ required: true, message: '请选择部门' }]}
                  fieldProps={{
                    treeCheckable: true,
                    showCheckedStrategy: 'SHOW_PARENT',
                    treeNodeFilterProp: 'title',
                    variant: 'outlined',
                    fieldNames: {
                      label: 'title',
                      value: 'value',
                    },
                  }}
                  request={async () => {
                    const result = await getDepartments({ pageSize: 1000 });
                    const list = result?.data || (Array.isArray(result) ? result : []);
                    const treeData = list.map((item: any) => ({
                      title: item.name,
                      value: item.id,
                      id: item.id,
                      parent_id: item.parent_id,
                      key: item.id,
                    }));
                    return listToTree(treeData);
                  }}
                />
              );
            }
            return null;
          }}
        </ProFormDependency>
      </ModalForm>

      {currentRow && (
        <DocumentDrawer
          open={docDrawerVisible}
          onClose={() => setDocDrawerVisible(false)}
          kbId={currentRow.id}
          kbName={currentRow.name}
        />
      )}
    </PageContainer>
  );
};

export default KnowledgeBaseList;