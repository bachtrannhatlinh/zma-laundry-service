import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Modal, message, Tag, Form, InputNumber } from 'antd';
import { UserOutlined, StarOutlined, PlusOutlined } from '@ant-design/icons';
import adminService from '../services/api';

const { Search } = Input;

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, [pagination.current, pagination.pageSize, searchText]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText
      };
      
      const response = await adminService.getCustomers(params);
      setCustomers(response.customers || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error) {
      message.error('Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoints = async (values) => {
    try {
      await adminService.updateCustomerPoints(
        selectedCustomer.phoneNumber,
        values.points,
        values.description
      );
      message.success('Cập nhật điểm thưởng thành công');
      setPointsModalVisible(false);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      message.error('Lỗi khi cập nhật điểm thưởng');
    }
  };

  const columns = [
    {
      title: 'Tên khách hàng',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Điểm hiện tại',
      dataIndex: 'points',
      key: 'points',
      render: (points) => (
        <Tag color="gold" icon={<StarOutlined />}>
          {points || 0} điểm
        </Tag>
      ),
    },
    {
      title: 'Tổng đơn hàng',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      render: (total) => total || 0,
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => {
            setSelectedCustomer(record);
            setPointsModalVisible(true);
          }}
        >
          Cập nhật điểm
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card title="Quản lý khách hàng">
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="Tìm theo tên hoặc số điện thoại"
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="phoneNumber"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} khách hàng`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
          }}
        />
      </Card>

      <Modal
        title="Cập nhật điểm thưởng"
        open={pointsModalVisible}
        onCancel={() => {
          setPointsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        {selectedCustomer && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdatePoints}
          >
            <p><strong>Khách hàng:</strong> {selectedCustomer.fullName}</p>
            <p><strong>Điểm hiện tại:</strong> {selectedCustomer.points || 0} điểm</p>
            
            <Form.Item
              name="points"
              label="Số điểm thay đổi"
              rules={[{ required: true, message: 'Vui lòng nhập số điểm' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Nhập số điểm (âm để trừ điểm)"
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
              rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Nhập lý do thay đổi điểm"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Cập nhật
                </Button>
                <Button onClick={() => {
                  setPointsModalVisible(false);
                  form.resetFields();
                }}>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Customers;