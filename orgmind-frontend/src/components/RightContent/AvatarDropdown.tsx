import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Spin, message } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { outLogin, updateCurrentUser } from '@/services/ant-design-pro/login';
import HeaderDropdown from '../HeaderDropdown';
import { ModalForm, ProFormText } from '@ant-design/pro-components';

export type GlobalHeaderRightProps = {
  menu?: boolean;
  children?: React.ReactNode;
};

export const AvatarName = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  return <span className="anticon">{currentUser?.name}</span>;
};

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      display: 'flex',
      height: '48px',
      marginLeft: 'auto',
      overflow: 'hidden',
      alignItems: 'center',
      padding: '0 8px',
      cursor: 'pointer',
      borderRadius: token.borderRadius,
      '&:hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
  };
});

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
  menu,
  children,
}) => {
  /**
   * 退出登录，并且将当前的 url 保存
   */
  const loginOut = async () => {
    await outLogin();
    localStorage.removeItem('token'); // 清除 token
    const { search, pathname } = window.location;
    const urlParams = new URL(window.location.href).searchParams;
    const searchParams = new URLSearchParams({
      redirect: pathname + search,
    });
    /** 此方法会跳转到 redirect 参数所在的位置 */
    const redirect = urlParams.get('redirect');
    // Note: There may be security issues, please note
    if (window.location.pathname !== '/user/login' && !redirect) {
      history.replace({
        pathname: '/user/login',
        search: searchParams.toString(),
      });
    }
  };
  const { styles } = useStyles();

  const { initialState, setInitialState } = useModel('@@initialState');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const onMenuClick: MenuProps['onClick'] = (event) => {
    const { key } = event;
    if (key === 'logout') {
      flushSync(() => {
        setInitialState((s) => ({ ...s, currentUser: undefined }));
      });
      loginOut();
      return;
    }
    if (key === 'changePassword') {
      setPasswordModalVisible(true);
      return;
    }
    history.push(`/account/${key}`);
  };

  const loading = (
    <span className={styles.action}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  if (!initialState) {
    return loading;
  }

  const { currentUser } = initialState;

  if (!currentUser || !currentUser.name) {
    return loading;
  }

  const menuItems = [
    ...(menu
      ? [
          {
            key: 'center',
            icon: <UserOutlined />,
            label: '个人中心',
          },
          {
            key: 'settings',
            icon: <SettingOutlined />,
            label: '个人设置',
          },
          {
            key: 'changePassword',
            icon: <KeyOutlined />,
            label: '修改密码',
          },
          {
            type: 'divider' as const,
          },
        ]
      : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  return (
    <>
      <HeaderDropdown
        menu={{
          selectedKeys: [],
          onClick: onMenuClick,
          items: menuItems,
        }}
      >
        {children}
      </HeaderDropdown>
      <ModalForm
        title="修改密码"
        width="400px"
        open={passwordModalVisible}
        onOpenChange={setPasswordModalVisible}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          if (values.password !== values.confirm_password) {
            message.error('两次输入的密码不一致');
            return false;
          }
          try {
            await updateCurrentUser({
              password: values.password,
              old_password: values.old_password,
            });
            message.success('密码修改成功');
            setPasswordModalVisible(false);
            return true;
          } catch (error) {
            // Error handled by request interceptor usually
            return false;
          }
        }}
      >
        <ProFormText.Password
          name="old_password"
          label="原密码"
          rules={[{ required: true, message: '请输入原密码' }]}
        />
        <ProFormText.Password
          name="password"
          label="新密码"
          rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少6位' }]}
        />
        <ProFormText.Password
          name="confirm_password"
          label="确认新密码"
          rules={[{ required: true, message: '请再次输入新密码' }]}
        />
      </ModalForm>
    </>
  );
};
