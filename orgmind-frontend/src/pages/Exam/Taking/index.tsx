import { PageContainer } from '@ant-design/pro-components';
import { Card, Button, Radio, Checkbox, Space, Typography, App, Result, Spin, Divider } from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams, history } from 'umi';
import { getExam, submitExam, getExamResult } from '@/services/ant-design-pro/exam';

const ExamTaking: React.FC = () => {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<API.Exam>();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (id) {
      loadExam(id);
    }
  }, [id]);

  const loadExam = async (examId: string) => {
    try {
      // Check if already submitted
      try {
          const result = await getExamResult(examId);
          if (result && result.status === 'completed') {
              message.info('您已完成该考试，正在跳转查看成绩...');
              history.replace(`/exam/result/${examId}`);
              return;
          }
      } catch (e) {
          // Ignore error (e.g. 404 not found means not taken yet)
      }

      const data = await getExam(examId);
      setExam(data);
    } catch (error) {
      message.error('加载考试失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!id) return;
    
    // Check if all answered? (Optional)
    const answeredCount = Object.keys(answers).length;
    if (exam?.questions && answeredCount < exam.questions.length) {
      if (!window.confirm(`还有 ${exam.questions.length - answeredCount} 道题未作答，确定提交吗？`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      // Format answers: array to string for multiple choice
      const formattedAnswers: Record<string, string> = {};
      Object.entries(answers).forEach(([key, val]) => {
          if (Array.isArray(val)) {
              formattedAnswers[key] = val.sort().join(','); // A,B
          } else {
              formattedAnswers[key] = String(val);
          }
      });

      await submitExam(id, { answers: formattedAnswers });
      message.success('提交成功！');
      history.replace(`/exam/result/${id}`);
    } catch (error: any) {
      console.error('Submit error:', error);
      const errorDetail = error?.response?.data?.detail || error?.data?.detail;
      
      if (errorDetail === 'You have already submitted this exam') {
          message.warning('您已提交过该试卷，即将跳转查看成绩');
          setTimeout(() => {
            history.replace(`/exam/result/${id}`);
          }, 1000);
          return;
      }
      
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageContainer><Spin size="large" /></PageContainer>;
  }

  if (!exam) {
    return (
      <PageContainer>
        <Result status="404" title="考试不存在" subTitle="请检查链接是否正确" />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={exam.title} content={exam.description}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {exam.questions?.map((q, index) => (
            <Card type="inner" title={`${index + 1}. ${q.content} （${q.type === 'multiple_choice' ? '多选' : '单选/判断'}）`} key={q.id}>
              {q.type === 'multiple_choice' ? (
                <Checkbox.Group
                  onChange={(checkedValues) => handleAnswerChange(q.id, checkedValues)}
                  value={answers[q.id]}
                >
                  <Space direction="vertical">
                    {q.options.map((opt) => (
                      <Checkbox value={opt.label} key={opt.label}>
                        {opt.label}. {opt.content}
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              ) : (
                <Radio.Group
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  value={answers[q.id]}
                >
                  <Space direction="vertical">
                    {q.type === 'true_false' ? (
                        <>
                            <Radio value="True">正确</Radio>
                            <Radio value="False">错误</Radio>
                        </>
                    ) : (
                        q.options.map((opt) => (
                        <Radio value={opt.label} key={opt.label}>
                            {opt.label}. {opt.content}
                        </Radio>
                        ))
                    )}
                  </Space>
                </Radio.Group>
              )}
            </Card>
          ))}

          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" size="large" onClick={handleSubmit} loading={submitting}>
              提交试卷
            </Button>
          </div>
        </Space>
      </Card>
    </PageContainer>
  );
};

export default ExamTaking;
