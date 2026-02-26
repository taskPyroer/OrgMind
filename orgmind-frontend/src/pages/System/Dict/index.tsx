import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, App, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { getDictTypes, createDictType, updateDictType, deleteDictType } from '@/services/ant-design-pro/system';
import { ModalForm, ProFormText, ProFormTextArea, ProFormSelect, ProFormSwitch } from '@ant-design/pro-components';
import DictDataList from './components/DictDataList';
import { useAccess } from '@umijs/max';

const DictTypeList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const access = useAccess();
  
  // 字典数据Drawer状态
  const [dictDataVisible, setDictDataVisible] = useState<boolean>(false);
  const [currentDictType, setCurrentDictType] = useState<any>();

  const renderFormFields = () => (
    <>
      <ProFormText width="md" name="name" label="字典名称" rules={[{ required: true }]} />
      <ProFormText width="md" name="code" label="字典类型编码" rules={[{ required: true }]} />
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
      <ProFormSwitch name="is_system" label="是否系统参数" initialValue={false} />
      <ProFormTextArea width="md" name="remark" label="备注" />
    </>
  );

  const columns: ProColumns<any>[] = [
    {
      title: '字典类型编码',
      dataIndex: 'code',
      copyable: true,
    },
    {
      title: '字典名称',
      dataIndex: 'name',
    },
    {
      title: '是否系统参数',
      dataIndex: 'is_system',
      search: false,
      render: (dom, record) => {
        return record.is_system ? <Tag color="red">系统参数</Tag> : <Tag>非系统参数</Tag>;
      },
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
        access.canSystemDictEdit && (
          <a
            key="data"
            onClick={() => {
              setCurrentDictType(record);
              setDictDataVisible(true);
            }}
          >
            <UnorderedListOutlined /> 维护值集
          </a>
        ),
        access.canSystemDictEdit && (
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
        access.canSystemDictDelete && !record.is_system && (
          <Popconfirm
            key="delete"
            title="确认删除该字典类型吗？"
            description="删除类型将同时删除所有字典数据！"
            onConfirm={async () => {
              try {
                await deleteDictType(record.id);
                message.success('删除成功');
                actionRef.current?.reload();
              } catch (error: any) {
                message.error('删除失败');
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
        headerTitle="字典类型列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        toolBarRender={() => [
          access.canSystemDictAdd && (
            <Button
              key="button"
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => {
                setCurrentRow(undefined);
                setModalVisible(true);
              }}
            >
              新建
            </Button>
          ),
        ].filter(Boolean)}
        request={async (params) => {
          const msg = await getDictTypes(params);
          return {
            data: msg.data,
            success: msg.success,
            total: msg.total,
          };
        }}
        columns={columns}
      />
      
      <ModalForm
        title={currentRow ? '编辑字典类型' : '新建字典类型'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow) {
              await updateDictType(currentRow.id, values);
              message.success('更新成功');
            } else {
              await createDictType(values);
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

      <DictDataList
        visible={dictDataVisible}
        onClose={() => setDictDataVisible(false)}
        dictType={currentDictType}
      />
    </PageContainer>
  );
};

export default DictTypeList;
