# BTN Laundry Admin Dashboard

Admin dashboard web application để quản lý hệ thống giặt ủi BTN Laundry.

## Tính năng

- 📊 Dashboard với thống kê tổng quan
- 📦 Quản lý đơn hàng (xem, cập nhật trạng thái)
- 👥 Quản lý khách hàng
- ⭐ Quản lý hệ thống điểm thưởng
- 📱 Responsive design

## Công nghệ sử dụng

- **Frontend**: React 18, React Router v6
- **UI Library**: Ant Design
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Build Tool**: Create React App

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 16.x
- npm hoặc yarn

### Cài đặt dependencies
```bash
npm install
```

### Cấu hình môi trường
1. Copy file `.env.example` thành `.env`
2. Cập nhật các biến môi trường phù hợp:
```bash
cp .env.example .env
```

### Chạy ở môi trường development
```bash
npm start
```

Ứng dụng sẽ chạy tại: http://localhost:3000

### Build cho production
```bash
npm run build
```

### Chạy tests
```bash
npm test
```

## Cấu trúc thư mục

```
client-web-admin/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Orders.jsx
│   │   ├── Customers.jsx
│   │   └── Points.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── .env
├── .env.example
├── .gitignore
└── README.md
```

## API Endpoints

Dashboard sử dụng các API endpoints sau:

- `GET /api/admin/dashboard` - Thống kê tổng quan
- `GET /api/orders` - Danh sách đơn hàng
- `PUT /api/orders/:id/status` - Cập nhật trạng thái đơn hàng
- `GET /api/customers` - Danh sách khách hàng
- `GET /api/customers/:phone/points` - Điểm thưởng khách hàng
- `POST /api/customers/:phone/points` - Cập nhật điểm thưởng

## Deployment

### Vercel
```bash
npm run build
# Deploy build folder to Vercel
```

### Netlify
```bash
npm run build
# Deploy build folder to Netlify
```

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.