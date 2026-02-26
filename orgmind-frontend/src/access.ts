/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  const permissions = currentUser?.permissions || [];
  
  return {
    canAdmin: currentUser && currentUser.access === 'admin',
    
    // User
    canSystemUserList: permissions.includes('system:user:list') || currentUser?.access === 'admin',
    canSystemUserAdd: permissions.includes('system:user:add') || currentUser?.access === 'admin',
    canSystemUserEdit: permissions.includes('system:user:edit') || currentUser?.access === 'admin',
    canSystemUserDelete: permissions.includes('system:user:delete') || currentUser?.access === 'admin',

    // Role
    canSystemRoleList: permissions.includes('system:role:list') || currentUser?.access === 'admin',
    canSystemRoleAdd: permissions.includes('system:role:add') || currentUser?.access === 'admin',
    canSystemRoleEdit: permissions.includes('system:role:edit') || currentUser?.access === 'admin',
    canSystemRoleDelete: permissions.includes('system:role:delete') || currentUser?.access === 'admin',

    // Employee Role
    canSystemEmployeeRoleList: permissions.includes('system:employee-role:list') || currentUser?.access === 'admin',
    canSystemEmployeeRoleAdd: permissions.includes('system:employee-role:add') || currentUser?.access === 'admin',
    canSystemEmployeeRoleEdit: permissions.includes('system:employee-role:edit') || currentUser?.access === 'admin',
    canSystemEmployeeRoleDelete: permissions.includes('system:employee-role:delete') || currentUser?.access === 'admin',

    // Permission
    canSystemPermissionList: permissions.includes('system:permission:list') || currentUser?.access === 'admin',
    canSystemPermissionAdd: permissions.includes('system:permission:add') || currentUser?.access === 'admin',
    canSystemPermissionEdit: permissions.includes('system:permission:edit') || currentUser?.access === 'admin',
    canSystemPermissionDelete: permissions.includes('system:permission:delete') || currentUser?.access === 'admin',

    // Dict
    canSystemDictList: permissions.includes('system:dict:list') || currentUser?.access === 'admin',
    canSystemDictAdd: permissions.includes('system:dict:add') || currentUser?.access === 'admin',
    canSystemDictEdit: permissions.includes('system:dict:edit') || currentUser?.access === 'admin',
    canSystemDictDelete: permissions.includes('system:dict:delete') || currentUser?.access === 'admin',

    // OA Department
    canOaDepartmentList: permissions.includes('oa:department:list') || currentUser?.access === 'admin',
    canOaDepartmentAdd: permissions.includes('oa:department:add') || currentUser?.access === 'admin',
    canOaDepartmentEdit: permissions.includes('oa:department:edit') || currentUser?.access === 'admin',
    canOaDepartmentDelete: permissions.includes('oa:department:delete') || currentUser?.access === 'admin',

    // OA Position
    canOaPositionList: permissions.includes('oa:position:list') || currentUser?.access === 'admin',
    canOaPositionAdd: permissions.includes('oa:position:add') || currentUser?.access === 'admin',
    canOaPositionEdit: permissions.includes('oa:position:edit') || currentUser?.access === 'admin',
    canOaPositionDelete: permissions.includes('oa:position:delete') || currentUser?.access === 'admin',

    // OA Employee
    canOaEmployeeList: permissions.includes('oa:employee:list') || currentUser?.access === 'admin',
    canOaEmployeeAdd: permissions.includes('oa:employee:add') || currentUser?.access === 'admin',
    canOaEmployeeEdit: permissions.includes('oa:employee:edit') || currentUser?.access === 'admin',
    canOaEmployeeDelete: permissions.includes('oa:employee:delete') || currentUser?.access === 'admin',

    // OA Salary
    canOaSalaryList: permissions.includes('oa:salary:list') || currentUser?.access === 'admin',
    canOaSalaryAdd: permissions.includes('oa:salary:add') || currentUser?.access === 'admin',
    canOaSalaryEdit: permissions.includes('oa:salary:edit') || currentUser?.access === 'admin',
    canOaSalaryDelete: permissions.includes('oa:salary:delete') || currentUser?.access === 'admin',

    // RAG Knowledge Base
    canRagKbList: permissions.includes('rag:kb:list') || currentUser?.access === 'admin',
    canRagKbAdd: permissions.includes('rag:kb:add') || currentUser?.access === 'admin',
    canRagKbEdit: permissions.includes('rag:kb:edit') || currentUser?.access === 'admin',
    canRagKbDelete: permissions.includes('rag:kb:delete') || currentUser?.access === 'admin',

    // RAG Document
    canRagDocumentList: permissions.includes('rag:document:list') || currentUser?.access === 'admin',
    canRagDocumentAdd: permissions.includes('rag:document:add') || currentUser?.access === 'admin',
    canRagDocumentDelete: permissions.includes('rag:document:delete') || currentUser?.access === 'admin',

    // RAG Chat
    canRagChatUse: permissions.includes('rag:chat:use') || currentUser?.access === 'admin',
    canRagChatHistory: permissions.includes('rag:chat:history') || currentUser?.access === 'admin',

    // 考试管理权限 - 基于实际前端功能重新设计
    
    // 考试列表相关权限
    canExamList: permissions.includes('exam:list') || currentUser?.access === 'admin',
    canExamCreate: permissions.includes('exam:create') || currentUser?.access === 'admin',
    canExamEdit: permissions.includes('exam:edit') || currentUser?.access === 'admin',
    canExamDelete: permissions.includes('exam:delete') || currentUser?.access === 'admin',
    canExamPublish: permissions.includes('exam:publish') || currentUser?.access === 'admin',
    
    // 考试参与权限
    canExamTake: permissions.includes('exam:take') || currentUser?.access === 'admin',
    canExamSubmit: permissions.includes('exam:submit') || currentUser?.access === 'admin',
    
    // 考试结果权限
    canExamViewResult: permissions.includes('exam:view-result') || currentUser?.access === 'admin',
    canExamViewAllResults: permissions.includes('exam:view-all-results') || currentUser?.access === 'admin',
    canExamExportResults: permissions.includes('exam:export-results') || currentUser?.access === 'admin',
    
    // 考试配置权限（题目管理）
    canExamManageQuestions: permissions.includes('exam:manage-questions') || currentUser?.access === 'admin',
  };
}
