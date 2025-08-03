import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Select, message, Input } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import adminService from '../services/api';

const { Search } = Input;
const { Option } = Select;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter
      };
      
      const response = await adminService.getOrders(params);
      setOrders(response.orders || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error) {
      message.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      console.log('Updating order ID:', selectedOrder._id);
      console.log('New status:', newStatus);
      console.log('Request URL:', `/orders/${selectedOrder._id}/status`);
      
      const response = await adminService.updateOrderStatus(selectedOrder._id, newStatus);
      console.log('Response:', response);
      
      message.success('Cập nhật trạng thái thành công');
      setStatusModalVisible(false);
      fetchOrders();
    } catch (error) {
      console.error('Update error:', error);
      console.error('Error response:', error.response?.data);
      message.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'orange',
      confirmed: 'blue',
      processing: 'purple',
      ready: 'cyan',
      completed: 'green',
      cancelled: 'red'
    };
    return statusColors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      ready: 'Sẵn sàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return statusTexts[status] || status;
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderId',
      key: 'orderId',
    },
    {
      title: 'Khách hàng',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${amount?.toLocaleString('vi-VN')}đ`,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setSelectedOrder(record);
              setStatusModalVisible(true);
            }}
          >
            Cập nhật
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="Quản lý đơn hàng">
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="Tìm theo mã đơn hoặc tên khách hàng"
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
          />
          
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: 200 }}
            onChange={setStatusFilter}
          >
            <Option value="pending">Chờ xác nhận</Option>
            <Option value="confirmed">Đã xác nhận</Option>
            <Option value="processing">Đang xử lý</Option>
            <Option value="ready">Sẵn sàng</Option>
            <Option value="completed">Hoàn thành</Option>
            <Option value="cancelled">Đã hủy</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
          }}
        />
      </Card>

      <Modal
        title="Cập nhật trạng thái đơn hàng"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
      >
        {selectedOrder && (
          <div>
            <p><strong>Mã đơn hàng:</strong> {selectedOrder.orderId}</p>
            <p><strong>Khách hàng:</strong> {selectedOrder.fullName}</p>
            <p><strong>Trạng thái hiện tại:</strong> 
              <Tag color={getStatusColor(selectedOrder.status)} style={{ marginLeft: 8 }}>
                {getStatusText(selectedOrder.status)}
              </Tag>
            </p>
            
            <div style={{ marginTop: 16 }}>
              <p><strong>Chọn trạng thái mới:</strong></p>
              <Space wrap>
                <Button onClick={() => handleUpdateStatus('confirmed')}>
                  Xác nhận
                </Button>
                <Button onClick={() => handleUpdateStatus('picked_up')}>
                  Đã nhận đồ
                </Button>
                <Button onClick={() => handleUpdateStatus('washing')}>
                  Đang giặt
                </Button>
                <Button onClick={() => handleUpdateStatus('ready')}>
                  Sẵn sàng
                </Button>
                <Button onClick={() => handleUpdateStatus('delivered')}>
                  Đã giao
                </Button>
                <Button danger onClick={() => handleUpdateStatus('cancelled')}>
                  Hủy đơn
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;




