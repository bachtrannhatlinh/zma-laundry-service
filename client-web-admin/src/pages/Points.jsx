import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Input, Space, DatePicker, Select } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import adminService from '../services/api';
import moment from 'moment';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Points = () => {
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    dateRange: null,
    type: ''
  });

  useEffect(() => {
    fetchPointsHistory();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchPointsHistory = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
        startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD')
      };
      
      const response = await adminService.getPointsHistory(params);
      setPointsHistory(response.history || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error) {
      console.error('Error fetching points history:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          earn: { color: 'green', text: 'Tích điểm' },
          redeem: { color: 'red', text: 'Đổi điểm' },
          adjust: { color: 'blue', text: 'Điều chỉnh' },
          bonus: { color: 'purple', text: 'Thưởng' }
        };
        const typeInfo = typeMap[type] || { color: 'default', text: type };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: 'Điểm thay đổi',
      dataIndex: 'points',
      key: 'points',
      render: (points) => (
        <span style={{ 
          color: points > 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {points > 0 ? '+' : ''}{points}
        </span>
      ),
    },
    {
      title: 'Điểm sau giao dịch',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      render: (balance) => (
        <Tag color="gold" icon={<StarOutlined />}>
          {balance} điểm
        </Tag>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (orderId) => orderId || '-',
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  return (
    <div>
      <Card title="Lịch sử điểm thưởng">
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="Tìm theo tên hoặc số điện thoại"
            allowClear
            style={{ width: 250 }}
            onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
          />
          
          <Select
            placeholder="Loại giao dịch"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => setFilters(prev => ({ ...prev, type: value || '' }))}
          >
            <Option value="earn">Tích điểm</Option>
            <Option value="redeem">Đổi điểm</Option>
            <Option value="adjust">Điều chỉnh</Option>
            <Option value="bonus">Thưởng</Option>
          </Select>

          <RangePicker
            placeholder={['Từ ngày', 'Đến ngày']}
            format="DD/MM/YYYY"
            onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={pointsHistory}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} giao dịch`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
          }}
        />
      </Card>
    </div>
  );
};

export default Points;