import React, { useEffect, useState } from 'react';
import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { Column, Pie, Area, Bar } from '@ant-design/plots';
import { getRagDashboardStats, getRagMonitorStats } from '@/services/ant-design-pro/rag';
import { Spin, Row, Col, Radio, List, Tag, Table } from 'antd';
import type { RadioChangeEvent } from 'antd';
import {
  LineChartOutlined,
  MessageOutlined,
  TeamOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const { Statistic } = StatisticCard;

// --- 运营报表组件 (原有逻辑) ---
const OverviewDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    total_kbs: number;
    total_docs: number;
    total_chats: number;
    chat_trend: { date: string; count: number }[];
    top_kbs: { name: string; count: number }[];
    doc_status_dist: { status: string; count: number }[];
  }>({
    total_kbs: 0,
    total_docs: 0,
    total_chats: 0,
    chat_trend: [],
    top_kbs: [],
    doc_status_dist: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getRagDashboardStats();
        setData(res);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chatTrendConfig = {
    data: data.chat_trend,
    xField: 'date',
    yField: 'count',
    color: '#1890ff',
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      text: (d: any) => `${d.count}`,
      position: 'inside',
      style: {
        fill: '#FFFFFF',
        opacity: 0.8,
      },
    },
    axis: {
      x: {
        labelFormatter: (val: string) => val,
      },
    },
    meta: {
        date: { alias: '日期' },
        count: { alias: '问答次数' }
    }
  };

  const topKbConfig = {
    data: data.top_kbs,
    xField: 'name',
    yField: 'count',
    color: '#13c2c2',
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      text: (d: any) => `${d.count}`,
      position: 'inside',
      style: {
        fill: '#FFFFFF',
        opacity: 0.8,
      },
    },
    meta: {
        name: { alias: '知识库' },
        count: { alias: '调用次数' }
    }
  };
  
  const docStatusConfig = {
      data: data.doc_status_dist,
      angleField: 'count',
      colorField: 'status',
      radius: 0.8,
      innerRadius: 0.6,
      color: ['#52c41a', '#faad14', '#f5222d', '#d9d9d9'],
      label: {
          text: (d: any) => `${d.status}\n${d.count}`,
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
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <StatisticCard
            statistic={{
              title: '知识库总数',
              value: data.total_kbs,
              description: <Statistic title="当前" value={data.total_kbs} />,
              icon: (
                <div style={{ padding: 8, background: '#e6f7ff', borderRadius: '50%', color: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DatabaseOutlined style={{ fontSize: 24 }} />
                </div>
              ),
            }}
          />
        </Col>
        <Col span={8}>
          <StatisticCard
            statistic={{
              title: '文档总数',
              value: data.total_docs,
              description: <Statistic title="当前" value={data.total_docs} />,
              icon: (
                <div style={{ padding: 8, background: '#fff1f0', borderRadius: '50%', color: '#f5222d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 24 }} />
                </div>
              ),
            }}
          />
        </Col>
        <Col span={8}>
          <StatisticCard
            statistic={{
              title: '总问答次数',
              value: data.total_chats,
              description: <Statistic title="累计" value={data.total_chats} />,
              icon: (
                <div style={{ padding: 8, background: '#f6ffed', borderRadius: '50%', color: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageOutlined style={{ fontSize: 24 }} />
                </div>
              ),
            }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={12}>
          <ProCard title="近7天问答趋势" headerBordered bordered>
             <div style={{ height: 300 }}>
               <Column {...chatTrendConfig} />
             </div>
          </ProCard>
        </Col>
        <Col span={12}>
          <ProCard title="热门知识库 Top 5" headerBordered bordered>
             <div style={{ height: 300 }}>
               <Column {...topKbConfig} />
             </div>
          </ProCard>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
           <Col span={12}>
              <ProCard title="文档状态分布" headerBordered bordered>
                 <div style={{ height: 300 }}>
                   <Pie {...docStatusConfig} />
                 </div>
              </ProCard>
           </Col>
      </Row>
    </Spin>
  );
};

// --- 实时监控组件 (新功能) ---
const MonitorDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    cards: {
      visit_count: number;
      qa_count: number;
      uv_count: number;
      ip_count: number;
    };
    trend: { date: string; count: number }[];
    region_dist: { name: string; count: number }[];
    source_dist: { type: string; value: number }[];
    logs: { id: number; time: string; user: string; content: string; location: string; ip: string }[];
  }>({
    cards: { visit_count: 0, qa_count: 0, uv_count: 0, ip_count: 0 },
    trend: [],
    region_dist: [],
    source_dist: [],
    logs: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getRagMonitorStats({ time_range: timeRange });
        setData(res);
      } catch (error) {
        console.error('Failed to fetch monitor stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // 实时刷新机制 (可选，暂时仅在切换时间时刷新)
  }, [timeRange]);

  const handleTimeChange = (e: RadioChangeEvent) => {
    setTimeRange(e.target.value);
  };

  // 趋势图配置
  const trendConfig = {
    data: data.trend,
    xField: 'date',
    yField: 'count',
    areaStyle: () => {
      return {
        fill: 'l(270) 0:#ffffff 0.5:#d6e4ff 1:#2f54eb',
      };
    },
    line: {
      color: '#2f54eb',
    },
    meta: {
      date: { alias: '时间' },
      count: { alias: '访问量' }
    }
  };

  // 地区分布配置 (条形图)
  const regionConfig = {
    data: data.region_dist,
    xField: 'name',
    yField: 'count',
    seriesField: 'name',
    legend: false,
    color: ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E8684A', '#6DC8EC', '#9270CA', '#FF9D4D', '#269A99', '#FF99C3'],
    label: {
      text: (d: any) => `${d.count}`,
      position: 'right',
    },
    meta: {
      name: { alias: '地区' },
      count: { alias: '用户数' }
    }
  };

  // 来源分布配置 (环图)
  const sourceConfig = {
    data: data.source_dist,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    color: ['#1890ff', '#13c2c2', '#2fc25b', '#facc14'],
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
  };

  // 实时日志列定义
  const logColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
    { title: '用户', dataIndex: 'user', key: 'user', width: 120 },
    { title: '操作内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '地区', dataIndex: 'location', key: 'location', width: 100 },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 120 },
  ];

  return (
    <Spin spinning={loading}>
      {/* 顶部筛选栏 */}
      <ProCard style={{ marginBottom: 24 }} bodyStyle={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: 16 }}>数据概览</span>
          <Radio.Group value={timeRange} onChange={handleTimeChange} buttonStyle="solid">
            <Radio.Button value="24h">近24小时</Radio.Button>
            <Radio.Button value="7d">近7天</Radio.Button>
            <Radio.Button value="30d">近30天</Radio.Button>
            <Radio.Button value="90d">近90天</Radio.Button>
          </Radio.Group>
        </div>
      </ProCard>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <StatisticCard
            statistic={{
              title: '访问次数',
              value: data.cards.visit_count,
              icon: (
                <div style={{ padding: 8, background: '#e6f7ff', borderRadius: '50%', color: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LineChartOutlined style={{ fontSize: 24 }} />
                </div>
              ),
            }}
          />
        </Col>
        <Col span={6}>
          <StatisticCard
            statistic={{
              title: '问答次数',
              value: data.cards.qa_count,
              icon: (
                <div style={{ padding: 8, background: '#f6ffed', borderRadius: '50%', color: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageOutlined style={{ fontSize: 24 }} />
                </div>
              ),
            }}
          />
        </Col>
        <Col span={6}>
          <StatisticCard
            statistic={{
              title: '访问用户数 (UV)',
              value: data.cards.uv_count,
              icon: (
                <div style={{ padding: 8, background: '#f9f0ff', borderRadius: '50%', color: '#722ed1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TeamOutlined style={{ fontSize: 24 }} />
                </div>
              ),
            }}
          />
        </Col>
        <Col span={6}>
          <StatisticCard
            statistic={{
              title: '来源 IP 数',
              value: data.cards.ip_count,
              icon: (
                <div style={{ padding: 8, background: '#fffbe6', borderRadius: '50%', color: '#faad14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GlobalOutlined style={{ fontSize: 24 }} />
                </div>
              ),
            }}
          />
        </Col>
      </Row>

      {/* 趋势图 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <ProCard title="访问趋势" headerBordered bordered>
            <div style={{ height: 350 }}>
              <Area {...trendConfig} />
            </div>
          </ProCard>
        </Col>
      </Row>

      {/* 分布图 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={12}>
          <ProCard title="用户分布 (Top 10)" headerBordered bordered>
            <div style={{ height: 350 }}>
              <Bar {...regionConfig} />
            </div>
          </ProCard>
        </Col>
        <Col span={12}>
          <ProCard title="问答来源分布" headerBordered bordered>
            <div style={{ height: 350 }}>
              <Pie {...sourceConfig} />
            </div>
          </ProCard>
        </Col>
      </Row>

      {/* 实时日志 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <ProCard title="实时来访日志" headerBordered bordered>
            <Table 
              columns={logColumns} 
              dataSource={data.logs} 
              rowKey="id" 
              pagination={{ pageSize: 5 }} 
              size="small"
            />
          </ProCard>
        </Col>
      </Row>
    </Spin>
  );
};

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <PageContainer
      title="RAG 智能问答监控"
      tabList={[
        { tab: '运营报表', key: 'overview' },
        { tab: '实时监控', key: 'monitor' },
      ]}
      onTabChange={(key) => setActiveTab(key)}
    >
      {activeTab === 'overview' ? <OverviewDashboard /> : <MonitorDashboard />}
    </PageContainer>
  );
};

export default DashboardPage;
