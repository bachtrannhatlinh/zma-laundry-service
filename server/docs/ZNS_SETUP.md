# Hướng dẫn cấu hình ZNS (Zalo Notification Service)

## 1. Đăng ký Zalo Business Account
1. Truy cập [Zalo Business](https://business.zalo.me/)
2. Đăng ký tài khoản doanh nghiệp
3. Xác thực thông tin doanh nghiệp

## 2. Tạo Official Account (OA)
1. Tạo Official Account trên Zalo
2. Xác thực OA theo quy định của Zalo

## 3. Đăng ký ZNS Template
Tạo các template sau trong ZNS Console:

### Template 1: Xác nhận đơn hàng
```
Xin chào {{customer_name}},
Đơn hàng {{order_id}} đã được xác nhận.
Thời gian nhận đồ: {{pickup_time}}
Tổng tiền: {{total_amount}}
Trạng thái: {{status}}
Cảm ơn bạn đã sử dụng dịch vụ BTN Laundry!
```

### Template 2: Cập nhật trạng thái
```
Xin chào {{customer_name}},
Đơn hàng {{order_id}} đã được cập nhật.
Trạng thái hiện tại: {{status}}
Thời gian dự kiến: {{estimated_time}}
BTN Laundry - Dịch vụ giặt là chuyên nghiệp
```

### Template 3: Đơn hàng sẵn sàng
```
Xin chào {{customer_name}},
Đơn hàng {{order_id}} đã sẵn sàng!
Thời gian giao: {{delivery_time}}
Tổng tiền: {{total_amount}}
Vui lòng chuẩn bị nhận đồ. Cảm ơn bạn!
```

## 4. Cấu hình Environment Variables
Thêm vào file `.env`:
```
ZALO_APP_ID=your_app_id_here
ZALO_ACCESS_TOKEN=your_access_token_here
ZNS_ORDER_CONFIRMATION_TEMPLATE_ID=template_id_1
ZNS_STATUS_UPDATE_TEMPLATE_ID=template_id_2
ZNS_ORDER_READY_TEMPLATE_ID=template_id_3
```

## 5. Test ZNS
Sử dụng endpoint test:
```bash
POST /api/zns/test
{
  "phoneNumber": "0901234567",
  "templateType": "confirmation",
  "orderId": "TEST001"
}
```

## 6. Lưu ý quan trọng
- Số điện thoại phải đúng định dạng Việt Nam
- Template phải được Zalo duyệt trước khi sử dụng
- Access token có thời hạn, cần refresh định kỳ
- ZNS có giới hạn số lượng tin nhắn/ngày