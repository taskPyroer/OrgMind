import { PageContainer } from '@ant-design/pro-components';
import { Card, Result as AntResult, Button, Typography, Tag, Space, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ReadOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useParams, history, useSearchParams } from 'umi';
import { getExamResult, getExamResultById } from '@/services/ant-design-pro/exam';

const { Text, Paragraph } = Typography;

const ExamResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<API.ExamResult>();
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<403 | 404 | null>(null);

  useEffect(() => {
    if (id) {
      loadResult(id);
    }
  }, [id]);

  const loadResult = async (idParam: string) => {
    try {
      // Determine if we are fetching by Exam ID (default) or Result ID
      const isResultId = searchParams.get('type') === 'result_id';
      
      let data;
      if (isResultId) {
          data = await getExamResultById(idParam);
      } else {
          data = await getExamResult(idParam);
      }
      setResult(data);
    } catch (error: any) {
        if (error?.response?.status === 403) {
            setErrorStatus(403);
        } else {
            setErrorStatus(404);
        }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
      return <PageContainer loading />;
  }

  if (errorStatus === 403) {
      return (
          <PageContainer>
              <AntResult
                  status="403"
                  title="无权访问"
                  subTitle="您没有权限查看此考试结果（仅考生本人或超级管理员可见）。"
                  extra={
                      <Button type="primary" onClick={() => history.push('/exam/all-results')}>
                          返回成绩列表
                      </Button>
                  }
              />
          </PageContainer>
      );
  }

  if (!result || errorStatus === 404) {
    return (
      <PageContainer>
        <AntResult status="404" title="未找到结果" />
      </PageContainer>
    );
  }

  const isPass = result.score >= 60; // Should get pass_score from exam info if available

  return (
    <PageContainer>
      <Card>
        <AntResult
          status={isPass ? 'success' : 'error'}
          title={`考试得分：${result.score.toFixed(1)} 分`}
          subTitle={isPass ? '恭喜你，通过考试！' : '很遗憾，未能通过考试，请继续努力。'}
          extra={[
            <Button type="primary" key="list" onClick={() => history.push('/exam/list')}>
              返回列表
            </Button>,
             <Button key="all" onClick={() => history.push('/exam/all-results')}>
              全员成绩
            </Button>
          ]}
        />
        
        <Divider orientation="left">答题详情</Divider>
        
        <Space direction="vertical" style={{ width: '100%' }}>
            {result.details?.map((item, index) => (
                <Card 
                    key={item.question.id} 
                    type="inner"
                    title={
                        <Space>
                            <Text strong>{index + 1}. {item.question.content}</Text>
                            {item.is_correct ? (
                                <Tag color="success" icon={<CheckCircleOutlined />}>正确</Tag>
                            ) : (
                                <Tag color="error" icon={<CloseCircleOutlined />}>错误</Tag>
                            )}
                        </Space>
                    }
                >
                    <Space direction="vertical">
                        <Text>你的答案: <Text type={item.is_correct ? 'success' : 'danger'}>{item.user_answer || '(未作答)'}</Text></Text>
                        {!item.is_correct && (
                            <Text type="success">正确答案: {item.question.answer}</Text>
                        )}
                        {item.question.explanation && (
                            <Paragraph>
                                <Text strong>解析：</Text>
                                {item.question.explanation}
                            </Paragraph>
                        )}
                        {item.question.source_doc_id && result.kb_id && (
                            <div style={{ marginTop: 8 }}>
                                <a
                                    href={`/rag/knowledge-base/${result.kb_id}/view?docId=${item.question.source_doc_id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Space>
                                        <ReadOutlined />
                                        查看来源文档
                                    </Space>
                                </a>
                            </div>
                        )}
                    </Space>
                </Card>
            ))}
        </Space>
      </Card>
    </PageContainer>
  );
};

export default ExamResultPage;
