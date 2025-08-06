import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Table, Tag } from "antd";
import {
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import adminService from "../services/api";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const pagination = { current: 1, pageSize: 10, total: 0 }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const paramOrders = {
    page: pagination.current,
    limit: pagination.pageSize,
    search: '',
    status: '',
  };

  const paramCustomers = {
    page: pagination.current,
    limit: pagination.pageSize,
    search: '',
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersData, customersData] = await Promise.all([
        adminService.getOrders(paramOrders),
        adminService.getCustomers(paramCustomers),
      ]);

      const orders = ordersData.orders || [];
      const customers = customersData.customers || [];

      // Tính toán stats từ data thật
      const totalOrders = orders.length;
      const totalCustomers = customers.length;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      );
      const pendingOrders = orders.filter(
        (order) => order.status === "pending"
      ).length;

      setStats({
        totalOrders,
        totalCustomers,
        totalRevenue,
        pendingOrders,
      });

      setRecentOrders(orders.slice(0, 10));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "orange",
      confirmed: "blue",
      processing: "purple",
      ready: "cyan",
      completed: "green",
      cancelled: "red",
    };
    return statusColors[status] || "default";
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      processing: "Đang xử lý",
      ready: "Sẵn sàng",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return statusTexts[status] || status;
  };

  const columns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderId",
      key: "orderId",
    },
    {
      title: "Khách hàng",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => `${amount?.toLocaleString("vi-VN")}đ`,
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={stats.totalOrders || 0}
              prefix={<ShoppingOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={stats.totalCustomers || 0}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={stats.totalRevenue || 0}
              prefix={<DollarOutlined />}
              suffix="đ"
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đơn chờ xử lý"
              value={stats.pendingOrders || 0}
              prefix={<ClockCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="Doanh thu theo tháng" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `${value?.toLocaleString("vi-VN")}đ`,
                    "Doanh thu",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1890ff"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Đơn hàng gần đây" loading={loading}>
            <Table
              columns={columns}
              dataSource={recentOrders}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
