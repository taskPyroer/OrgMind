import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { theme, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { Column, Pie } from '@ant-design/plots';
import { getDashboardStats, getExamTrend, getKbDistribution } from '@/services/ant-design-pro/dashboard';

const Welcome: React.FC = () => {
  const { token } = theme.useToken();
  const { initialState } = useModel('@@initialState');
  
  const [stats, setStats] = useState<any>({});
  const [examTrend, setExamTrend] = useState<any[]>([]);
  const [kbDist, setKbDist] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statsData = await getDashboardStats();
        setStats(statsData);
        
        const trendData = await getExamTrend();
        setExamTrend(trendData);
        
        const kbData = await getKbDistribution();
        setKbDist(kbData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Charts config
  const columnConfig = {
    data: examTrend,
    xField: 'date',
    yField: 'value',
    label: {
      position: 'top',
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      type: { alias: '类别' },
      value: { alias: '考试人次' },
    },
  };

  const pieConfig = {
    appendPadding: 10,
    data: kbDist,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    color: ['#1890ff', '#13c2c2', '#2fc25b', '#facc14', '#8543E0', '#F04864'],
    label: {
      text: (d: any) => `${d.type}\n${d.value}`,
      position: 'spider',
    },
    legend: {
      color: {
        title: false,
        position: 'right',
        rowPadding: 5,
      },
    },
    interactions: [{ type: 'element-active' }],
  };

  return (
    <PageContainer>
      {/* 产品矩阵生态 - 放在最前面 */}
      <ProCard 
        style={{ marginBottom: 16 }} 
        title="🚀 我的产品矩阵" 
        headerBordered 
        bordered
      >
        <div style={{ color: token.colorTextSecondary }}>
          <p>👋 嗨，我是在职的Python软件工程师，有空的时候喜欢折腾各种小项目：</p>
          
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <ProCard ghost gutter={16} style={{ marginBottom: 16 }}>
              <ProCard hoverable bordered style={{ textAlign: 'center' }}>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ color: '#1890ff', marginBottom: 8 }}>🕷️ TaskPyro 爬虫管理平台</h3>
                  <p style={{ marginBottom: 12 }}>分布式Python任务调度平台</p>
                  <div style={{ fontSize: '12px', color: token.colorTextSecondary, marginBottom: 12 }}>
                    ✓ 支持分布式部署<br/>
                    ✓ 可视化DAG编排<br/>
                    ✓ 多环境隔离<br/>
                    ✓ 实时日志监控
                  </div>
                  <a 
                    href="https://docs.taskpyro.cn/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#1890ff' }}
                  >
                    体验Demo →
                  </a>
                </div>
              </ProCard>
              
              <ProCard hoverable bordered style={{ textAlign: 'center' }}>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ color: '#52c41a', marginBottom: 8 }}>🎯 DjangoVue3Admin</h3>
                  <p style={{ marginBottom: 12 }}>企业级权限管理系统</p>
                  <div style={{ fontSize: '12px', color: token.colorTextSecondary, marginBottom: 12 }}>
                    ✓ Django + Vue3<br/>
                    ✓ Casbin细粒度权限<br/>
                    ✓ 代码生成器<br/>
                    ✓ 多租户支持
                  </div>
                  <a 
                    href="https://github.com/taskPyroer/DjangoVue3Admin" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#52c41a' }}
                  >
                    查看源码 →
                  </a>
                </div>
              </ProCard>
            </ProCard>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 12 }}>还有一些小玩意</h4>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
             
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>💬 </span>
                <div>
                  <div style={{ fontWeight: 500 }}>微信公众号</div>
                  <div style={{ fontSize: '12px', color: token.colorTextSecondary }}>布鲁的Python之旅</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🐙</span>
                <div>
                  <div style={{ fontWeight: 500 }}>GitHub</div>
                  <div style={{ fontSize: '12px', color: token.colorTextSecondary }}>
                    <a 
                      href="https://github.com/taskPyroer" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'inherit' }}
                    >
                      @taskPyroer
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            background: token.colorBgContainer, 
            padding: '16px', 
            borderRadius: '8px',
            border: `1px solid ${token.colorBorder}`,
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 500, marginBottom: '8px' }}>💡 关于我</div>
            <div style={{ color: token.colorTextSecondary }}>
              专注于<strong>企业级系统架构</strong>与<strong>AI应用落地</strong>，热衷探索新技术，<br/>
              用代码解决实际问题，让技术创造更多价值。欢迎交流讨论！
            </div>
          </div>
        </div>
      </ProCard>

      {/* 数据统计卡片 */}
      <ProCard ghost gutter={16} style={{ marginBottom: 16 }}>
        <ProCard loading={loading} hoverable bordered>
          <Statistic title="总用户数" value={stats.user_count || 0} suffix="人" />
        </ProCard>
        <ProCard loading={loading} hoverable bordered>
          <Statistic title="知识库文档" value={stats.doc_count || 0} suffix="篇" />
        </ProCard>
        <ProCard loading={loading} hoverable bordered>
          <Statistic title="发布考试" value={stats.exam_count || 0} suffix="场" />
        </ProCard>
        <ProCard loading={loading} hoverable bordered>
          <Statistic 
            title="平均通过率" 
            value={stats.pass_rate || 0} 
            precision={2} 
            suffix="%" 
            valueStyle={{ color: (stats.pass_rate || 0) >= 60 ? '#3f8600' : '#cf1322' }}
          />
        </ProCard>
      </ProCard>

      <ProCard split="vertical" bordered headerBordered>
        <ProCard title="近7天考试趋势" colSpan="60%">
             {examTrend.length > 0 ? (
                 <Column {...columnConfig} />
             ) : (
                 <div style={{ textAlign: 'center', padding: '50px 0', color: token.colorTextSecondary }}>
                     暂无考试数据
                 </div>
             )}
        </ProCard>
        <ProCard title="知识库文档分布">
             {kbDist.length > 0 ? (
                 <Pie {...pieConfig} />
             ) : (
                 <div style={{ textAlign: 'center', padding: '50px 0', color: token.colorTextSecondary }}>
                     暂无文档数据
                 </div>
             )}
        </ProCard>
      </ProCard>
      
      {/* 系统说明 */}
      <ProCard 
        style={{ marginTop: 16 }} 
        title="系统说明" 
        headerBordered 
        bordered
      >
        <div style={{ color: token.colorTextSecondary }}>
          <p>欢迎使用 OrgMind 组织智能系统。本系统集成了 OA 组织管理、RAG 知识库检索、AI 智能出题考试等核心功能。</p>
          <p>您可以通过上方导航栏快速访问各个模块：</p>
          <ul>
            <li><b>组织管理</b>：管理部门、员工及账号信息。</li>
            <li><b>知识库</b>：上传和管理企业知识文档，支持 AI 语义检索。</li>
            <li><b>考试中心</b>：利用 AI 自动生成试卷，组织员工在线考试。</li>
          </ul>
        </div>
      </ProCard>
    </PageContainer>
  );
};

export default Welcome;
