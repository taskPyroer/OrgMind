import React, { useRef, useState } from 'react';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, App, Popconfirm, Drawer } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getDictData, createDictData, updateDictData, deleteDictData } from '@/services/ant-design-pro/system';
import { ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormTextArea, ProFormSwitch } from '@ant-design/pro-components';

interface DictDataListProps {
  dictType: any;
  visible: boolean;
  onClose: () => void;
}

const DictDataList: React.FC<DictDataListProps> = (props) => {
  const { dictType, visible, onClose } = props;
  const actionRef = useRef<ActionType>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const { message } = App.useApp();

  const renderFormFields = () => (
    <>
      <ProFormText width="md" name="label" label="字典标签" rules={[{ required: true }]} />
      <ProFormText width="md" name="value" label="字典键值" rules={[{ required: true }]} />
      <ProFormDigit width="md" name="sort" label="排序" initialValue={0} />
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
      <ProFormSwitch name="is_default" label="是否默认" initialValue={false} />
      <ProFormTextArea width="md" name="remark" label="备注" />
    </>
  );

  const columns: ProColumns<any>[] = [
    {
      title: '字典标签',
      dataIndex: 'label',
    },
    {
      title: '字典键值',
      dataIndex: 'value',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      sorter: (a, b) => a.sort - b.sort,
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
          title="确认删除该字典数据吗？"
          onConfirm={async () => {
            try {
              await deleteDictData(record.id);
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
        </Popconfirm>,
      ],
    },
  ];

  return (
    <Drawer
      title={`字典数据 - ${dictType?.name || ''}`}
      width={800}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
      <ProTable<any>
        headerTitle="字典数据列表"
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
            <PlusOutlined /> 新建数据
          </Button>,
        ]}
        request={async (params) => {
          if (!dictType?.id) return { data: [], success: true };
          const msg = await getDictData({ ...params, dict_type_id: dictType.id });
          return {
            data: msg.data,
            success: msg.success,
            total: msg.total,
          };
        }}
        columns={columns}
      />
      
      <ModalForm
        title={currentRow ? '编辑字典数据' : '新建字典数据'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={currentRow}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            const formData = { ...values, dict_type_id: dictType.id };
            if (currentRow) {
              await updateDictData(currentRow.id, formData);
              message.success('更新成功');
            } else {
              await createDictData(formData);
              message.success('创建成功');
            }
            setModalVisible(false);
            actionRef.current?.reload();
            return true;
          } catch (error: any) {
            message.error('提交失败');
            return false;
          }
        }}
      >
        {renderFormFields()}
      </ModalForm>
    </Drawer>
  );
};

export default DictDataList;
