import React, { useEffect, useState } from 'react';
import { PageContainer, ProForm, ProFormText, ProFormTextArea, ProFormDigit, ProFormList, ProFormSelect, ProCard } from '@ant-design/pro-components';
import { Button, App, Space, Card } from 'antd';
import { useParams, history } from 'umi';
import { getExamDetail, updateExam } from '@/services/ant-design-pro/exam';
import { ArrowLeftOutlined, ReadOutlined } from '@ant-design/icons';

const ExamEdit: React.FC = () => {
  const { message } = App.useApp();
  const [form] = ProForm.useForm();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<API.ExamDetail>();

  useEffect(() => {
    if (id) {
      loadExam();
    }
  }, [id]);

  const loadExam = async () => {
    setLoading(true);
    try {
      const res = await getExamDetail(id!);
      setInitialValues(res);
    } catch (error) {
      message.error('加载试卷失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (values: any) => {
    try {
      await updateExam(id!, values);
      message.success('保存成功');
      history.push('/exam/list');
      return true;
    } catch (error) {
      message.error('保存失败');
      return false;
    }
  };

  if (!initialValues && !loading) return <div>加载失败</div>;

  return (
    <PageContainer
        header={{
            title: '编辑试卷',
            extra: [
                <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => history.back()}>返回</Button>
            ]
        }}
    >
      {!loading && (
        <ProForm
          form={form}
          initialValues={initialValues}
          onFinish={handleFinish}
          submitter={{
              render: (props, dom) => {
                  return (
                      <Card style={{ position: 'fixed', bottom: 0, width: '100%', zIndex: 100, left: 0, textAlign: 'right', paddingRight: 40 }}>
                          <Space>{dom}</Space>
                      </Card>
                  )
              }
          }}
          style={{ paddingBottom: 60 }}
        >
          <ProCard title="基本信息" bordered headerBordered collapsible style={{ marginBottom: 16 }}>
             <ProFormText name="title" label="试卷标题" rules={[{ required: true }]} />
             <ProFormTextArea name="description" label="试卷描述" />
             <ProFormDigit name="duration" label="考试时长(分钟)" min={1} />
             <ProFormDigit name="pass_score" label="及格分数" min={0} max={100} />
          </ProCard>

          <ProFormList
            name="questions"
            label="题目列表"
            itemRender={({ listDom, action }, { index }) => {
                const sourceDocId = form.getFieldValue(['questions', index, 'source_doc_id']);
                const kbId = initialValues?.kb_id;

                return (
                <ProCard
                    bordered
                    style={{ marginBottom: 16 }}
                    title={
                        <Space>
                            <span>{`第 ${index + 1} 题`}</span>
                            {sourceDocId && kbId && (
                                <a 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/rag/knowledge-base/${kbId}/view?docId=${sourceDocId}`, '_blank');
                                    }}
                                    title="查看来源文档"
                                >
                                    <ReadOutlined />
                                </a>
                            )}
                        </Space>
                    }
                    extra={action}
                    collapsible
                    defaultCollapsed={false}
                >
                    {listDom}
                </ProCard>
            )}}
          >
             <ProFormText name="id" hidden />
             <ProFormText name="source_doc_id" hidden />
             <ProFormTextArea name="content" label="题目内容" rules={[{ required: true }]} />
             <ProFormSelect
                name="type"
                label="题目类型"
                options={[
                    { label: '单选题', value: 'single_choice' },
                    { label: '多选题', value: 'multiple_choice' },
                    { label: '判断题', value: 'true_false' },
                ]}
                rules={[{ required: true }]}
             />
             
             {/* Options for Choice questions */}
             <ProFormList
                name="options"
                label="选项"
                itemRender={({ listDom, action }, { index }) => (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>{listDom}</div>
                        {action}
                    </div>
                )}
             >
                <Space>
                    <ProFormText name="label" placeholder="选项标签(A/B/C...)" width="xs" />
                    <ProFormText name="content" placeholder="选项内容" width="xl" />
                </Space>
             </ProFormList>

             <ProFormText name="answer" label="正确答案" placeholder="单选填A，多选填A,B，判断填True/False" rules={[{ required: true }]} />
             <ProFormTextArea name="explanation" label="答案解析" />
          </ProFormList>
        </ProForm>
      )}
    </PageContainer>
  );
};

export default ExamEdit;
