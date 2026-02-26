import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright={`${new Date().getFullYear()} OrgMind 组织智能系统`}
      links={[
        {
          key: 'OrgMind',
          title: 'OrgMind 智能中枢',
          href: '#',
          blankTarget: true,
        },
        {
          key: 'github',
          title: <GithubOutlined />,
          href: 'https://gitee.com/taskPyroer/OrgMind',
          blankTarget: true,
        },
        {
          key: 'Doc',
          title: '使用文档',
          href: 'https://gitee.com/taskPyroer/OrgMind',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
