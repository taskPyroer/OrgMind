import { PageContainer, ProForm, ProFormText } from '@ant-design/pro-components';
import { Card, message, Tabs } from 'antd';
import { useModel } from '@umijs/max';
import { updateCurrentUser } from '@/services/ant-design-pro/login';
import React, { useEffect } from 'react';

const BasicSettings: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const [form] = ProForm.useForm();

  useEffect(() => {
    if (initialState?.currentUser) {
      form.setFieldsValue(initialState.currentUser);
    }
  }, [initialState?.currentUser, form]);

  const handleFinish = async (values: any) => {
    try {
      await updateCurrentUser(values);
      message.success('更新个人信息成功');
      // Update global state
      if (initialState?.currentUser) {
        setInitialState({
          ...initialState,
          currentUser: {
            ...initialState.currentUser,
            ...values,
          },
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <ProForm
      form={form}
      onFinish={handleFinish}
      submitter={{
        searchConfig: {
          submitText: '更新基本信息',
        },
        resetButtonProps: {
          style: {
            display: 'none',
          },
        },
      }}
    >
      <ProFormText
        width="md"
        name="name"
        label="姓名"
        rules={[
          {
            required: true,
            message: '请输入您的姓名!',
          },
        ]}
      />
      <ProFormText
        width="md"
        name="email"
        label="邮箱"
        rules={[
          {
            type: 'email',
            message: '请输入正确的邮箱格式!',
          },
        ]}
      />
      <ProFormText
        width="md"
        name="phone"
        label="手机号"
      />
    </ProForm>
  );
};

const SecuritySettings: React.FC = () => {
  const [form] = ProForm.useForm();

  const handleFinish = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的密码不一致');
      return false;
    }
    try {
      await updateCurrentUser({
        password: values.new_password,
        old_password: values.old_password,
      });
      message.success('密码修改成功');
      form.resetFields();
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <ProForm
      form={form}
      onFinish={handleFinish}
      submitter={{
        searchConfig: {
          submitText: '修改密码',
        },
        resetButtonProps: {
          style: {
            display: 'none',
          },
        },
      }}
    >
      <ProFormText.Password
        width="md"
        name="old_password"
        label="当前密码"
        rules={[
          {
            required: true,
            message: '请输入当前密码!',
          },
        ]}
      />
      <ProFormText.Password
        width="md"
        name="new_password"
        label="新密码"
        rules={[
          {
            required: true,
            message: '请输入新密码!',
          },
          {
            min: 6,
            message: '密码长度不能少于6位',
          },
        ]}
      />
      <ProFormText.Password
        width="md"
        name="confirm_password"
        label="确认新密码"
        rules={[
          {
            required: true,
            message: '请再次输入新密码!',
          },
        ]}
      />
    </ProForm>
  );
};

const Settings: React.FC = () => {
  return (
    <PageContainer>
      <Card bordered={false}>
        <Tabs
          items={[
            {
              key: 'basic',
              label: '基本设置',
              children: <BasicSettings />,
            },
            {
              key: 'security',
              label: '安全设置',
              children: <SecuritySettings />,
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default Settings;
