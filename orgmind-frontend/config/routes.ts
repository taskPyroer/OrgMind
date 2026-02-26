/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    path: '/welcome',
    name: 'welcome',
    icon: 'smile',
    component: './Welcome',
  },
  {
    path: '/oa',
    name: 'OA管理',
    icon: 'team',
    routes: [
      {
        path: '/oa/department',
        name: '部门管理',
        component: './OA/Department',
        access: 'canOaDepartmentList',
      },
      {
        path: '/oa/position',
        name: '岗位管理',
        component: './OA/Position',
        access: 'canOaPositionList',
      },
      {
        path: '/oa/employee',
        name: '职员管理',
        component: './OA/Employee',
        access: 'canOaEmployeeList',
      },
      {
         path: '/oa/salary',
         name: '薪酬项管理',
         component: './OA/Salary',
         access: 'canOaSalaryList',
      }
    ],
  },
  {
    path: '/rag/knowledge-base/:kbId/view',
    layout: false,
    component: './RAG/KnowledgeBase/DocumentViewer',
    name: '文档预览',
    hideInMenu: true,
  },
  {
    path: '/rag',
    name: '知识库管理',
    icon: 'read',
    routes: [
      {
        path: '/rag/dashboard',
        name: '数据总览',
        component: './RAG/Dashboard',
      },
      {
        path: '/rag/knowledge-base',
        name: '知识库列表',
        component: './RAG/KnowledgeBase',
      },
      {
        path: '/rag/chat',
        name: '智能问答',
        component: './RAG/Chat',
      },
      {
        path: '/rag/portal-config',
        name: '门户配置',
        component: './Portal/Admin/Config',
      },
      {
        path: '/rag/history',
        name: '对话历史记录',
        component: './RAG/History',
      },
    ],
  },
  {
    path: '/exam',
    name: '考试中心',
    icon: 'highlight',
    routes: [
      {
        path: '/exam/list',
        name: '考试列表',
        component: './Exam/List',
      },
      {
        path: '/exam/all-results',
        name: '成绩看板',
        component: './Exam/AllResults',
      },
      {
        path: '/exam/taking/:id',
        name: '参加考试',
        component: './Exam/Taking',
        hideInMenu: true,
      },
      {
        path: '/exam/edit/:id',
        name: '编辑试卷',
        component: './Exam/Edit',
        hideInMenu: true,
      },
      {
        path: '/exam/result/:id',
        name: '考试结果',
        component: './Exam/Result',
        hideInMenu: true,
      },
    ],
  },
  {
    path: '/system',
    name: '系统管理',
    icon: 'setting',
    routes: [
      {
        path: '/system/user',
        name: '用户管理',
        component: './System/User',
        access: 'canSystemUserList',
      },
      {
        path: '/system/employee-role',
        name: '职员与角色',
        component: './System/EmployeeRole',
        access: 'canSystemUserList',
      },
      {
        path: '/system/role',
        name: '角色管理',
        component: './System/Role',
        access: 'canSystemRoleList',
      },
      {
        path: '/system/permission',
        name: '权限管理',
        component: './System/Permission',
        access: 'canSystemPermissionList',
      },
      {
        path: '/system/dict',
        name: '字典管理',
        component: './System/Dict',
        access: 'canSystemDictList',
      },
    ],
  },
  {
    path: '/account/settings',
    name: '个人设置',
    component: './Account/Settings',
    icon: 'user',
  },
  {
    path: '/portal',
    layout: false,
    component: './Portal/Home',
  },
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
