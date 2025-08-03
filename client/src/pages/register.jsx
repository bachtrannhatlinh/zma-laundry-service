import { useState, useEffect } from "react";
import { Box, Button, Input, Page, Text, Header, Icon, Grid, useNavigate } from "zmp-ui";
import { laundryService } from "../services/api";
import PointsInfo from "../components/points";

function RegisterPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  
  const showCustomToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Handle customer data callback from PointsInfo
  const handleCustomerData = (customerData) => {
    console.log('Customer data received:', customerData);
    if (customerData && customerData.isExisting) {
      setFormData(prev => ({
        ...prev,
        fullName: customerData.fullName || prev.fullName,
        address: customerData.address || prev.address
      }));
      setIsExistingCustomer(true);
      console.log('Set existing customer to true');
    } else {
      setIsExistingCustomer(false);
      console.log('Set existing customer to false');
    }
  };
  
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    orderId: "",
    pickupTime: "",
    deliveryTime: "",
    clothingItems: [],
    notes: "",
    serviceType: "standard",
    address: ""
  });

  // Tự động tạo mã đơn hàng khi component mount
  useEffect(() => {
    const autoOrderId = generateOrderId();
    setFormData(prev => ({
      ...prev,
      orderId: autoOrderId
    }));
  }, []);

  const [clothingTypes] = useState([
    { value: "shirt", label: "Áo sơ mi", price: 15000, icon: "zi-more-grid-2" },
    { value: "pants", label: "Quần dài", price: 20000, icon: "zi-more-grid-2" },
    { value: "dress", label: "Váy", price: 25000, icon: "zi-more-grid-2" },
    { value: "jacket", label: "Áo khoác", price: 30000, icon: "zi-more-grid-2" },
    { value: "bedsheet", label: "Ga giường", price: 35000, icon: "zi-more-grid-2" }
  ]);

  const serviceTypes = [
    { value: "standard", label: "Giặt thường (3-5 ngày)", price: 0 },
    { value: "express", label: "Giặt nhanh (1-2 ngày)", price: 10000 },
    { value: "premium", label: "Giặt cao cấp (2-3 ngày)", price: 20000 }
  ];

  const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BTNL${timestamp}${random}`;
  };

  const addClothingItem = (type) => {
    const item = clothingTypes.find(t => t.value === type);
    const existingItem = formData.clothingItems.find(i => i.type === type);
    
    if (existingItem) {
      // Tăng số lượng nếu đã có
      setFormData({
        ...formData,
        clothingItems: formData.clothingItems.map(i => 
          i.type === type ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      // Thêm mới
      setFormData({
        ...formData,
        clothingItems: [...formData.clothingItems, {
          type: type,
          quantity: 1,
          price: item.price
        }]
      });
    }
  };

  const removeClothingItem = (type) => {
    setFormData({
      ...formData,
      clothingItems: formData.clothingItems.filter(i => i.type !== type)
    });
  };

  const updateClothingQuantity = (type, quantity) => {
    if (quantity <= 0) {
      removeClothingItem(type);
      return;
    }
    
    setFormData({
      ...formData,
      clothingItems: formData.clothingItems.map(i => 
        i.type === type ? { ...i, quantity: quantity } : i
      )
    });
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.phoneNumber || !formData.pickupTime) {
      showCustomToast("⚠️ Vui lòng điền đầy đủ thông tin bắt buộc", "error");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      showCustomToast("⚠️ Số điện thoại không hợp lệ", "error");
      return;
    }

    // Validate clothing items
    if (formData.clothingItems.length === 0) {
      showCustomToast("⚠️ Vui lòng chọn ít nhất 1 loại đồ giặt", "error");
      return;
    }

    setIsLoading(true);

    const orderData = {
      ...formData,
      orderId: formData.orderId || generateOrderId(),
      createdAt: new Date().toISOString(),
      status: "pending"
    };

    try {
      // Gửi dữ liệu lên server
      const result = await laundryService.createOrder(orderData);
      console.log("Order created successfully:", result);
      
      showCustomToast("🎉 Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm.", "success");
      
      // Reset form sau khi thành công
      setTimeout(() => {
        setFormData({
          fullName: "",
          phoneNumber: "",
          orderId: "",
          pickupTime: "",
          deliveryTime: "",
          clothingItems: [],
          notes: "",
          serviceType: "standard",
          address: ""
        });
        
        // Quay về trang home sau khi reset form
        navigate("/");
      }, 1500);
      
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage = error.message || "Có lỗi xảy ra, vui lòng thử lại";
      showCustomToast(`❌ ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page className="register-page">
      <Header title="Đăng ký dịch vụ" showBackIcon={true} />
      
      {/* Spacer for fixed header */}
      <Box style={{ height: '16px' }}></Box>
      
      {/* Customer Info Section */}
      <Box className="info-card">
        <Text.Title size="medium" className="card-title">
          <Icon icon="zi-user" className="title-icon" />
          Thông tin khách hàng
        </Text.Title>
        
        <Box className="form-group">
          <Text className="form-label">Họ tên *</Text>
          <Box className={`input-wrapper ${isExistingCustomer ? 'customer-info-filled' : ''}`}>
            <Input
              placeholder="Nhập họ tên đầy đủ"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="form-input"
            />
            {isExistingCustomer && <span className="filled-indicator">✓</span>}
          </Box>
          {isExistingCustomer && (
            <Text size="xSmall" className="auto-fill-note">
              💡 Thông tin đã tự động điền từ database, bạn có thể chỉnh sửa
            </Text>
          )}
        </Box>

        <Box className="form-group">
          <Text className="form-label">Số điện thoại *</Text>
          <Input
            type="tel"
            placeholder="0xxx xxx xxx"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            className="form-input"
          />
        </Box>

        <Box className="form-group">
          <Text className="form-label">Địa chỉ</Text>
          <Box className={`input-wrapper ${isExistingCustomer ? 'customer-info-filled' : ''}`}>
            <Input
              placeholder="Nhập địa chỉ nhận/trả đồ"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="form-input"
            />
            {isExistingCustomer && <span className="filled-indicator">✓</span>}
          </Box>
          {isExistingCustomer && (
            <Text size="xSmall" className="auto-fill-note">
              💡 Địa chỉ đã tự động điền từ database, bạn có thể chỉnh sửa
            </Text>
          )}
        </Box>

        {/* Points Info Component */}
        {formData.phoneNumber && formData.phoneNumber.length >= 10 && (
          <PointsInfo 
            phoneNumber={formData.phoneNumber}
            orderAmount={formData.clothingItems.reduce((total, item) => total + (item.price * item.quantity), 0)}
            showEstimate={formData.clothingItems.length > 0}
            onCustomerData={handleCustomerData}
          />
        )}
      </Box>

      {/* Service Type Section */}
      <Box className="info-card">
        <Text.Title size="medium" className="card-title">
          <Icon icon="zi-star" className="title-icon" />
          Loại dịch vụ
        </Text.Title>
        
        <Box className="service-options">
          {serviceTypes.map((service) => (
            <Box 
              key={service.value}
              className={`service-option ${formData.serviceType === service.value ? 'selected' : ''}`}
              onClick={() => setFormData({...formData, serviceType: service.value})}
            >
              <Box>
                <Text className="service-name">{service.label}</Text>
                {service.price > 0 && (
                  <Text size="xSmall" className="service-price">+{service.price.toLocaleString()}đ</Text>
                )}
              </Box>
              <Icon icon={formData.serviceType === service.value ? "zi-check-circle" : "zi-circle"} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Clothing Items Selection */}
      <Box className="info-card">
        <Text.Title size="medium" className="card-title">
          <Icon icon="zi-bag" className="title-icon" />
          Chọn loại đồ giặt
        </Text.Title>
        
        <Grid cols={2} gap={16}>
          {clothingTypes.map((item) => {
            const isSelected = formData.clothingItems.some(selectedItem => selectedItem.type === item.value);
            return (
              <Box 
                key={item.value}
                className={`clothing-item-card ${isSelected ? 'selected' : ''}`}
                onClick={() => addClothingItem(item.value)}
              >
                <Icon icon={item.icon} />
                <Text size="small" className="item-name">{item.label}</Text>
                <Text size="xSmall" className="item-price">{item.price.toLocaleString()}đ</Text>
              </Box>
            );
          })}
        </Grid>

        {/* Selected Items */}
        {formData.clothingItems.length > 0 && (
          <Box className="selected-items">
            <Text className="selected-title">Đồ đã chọn:</Text>
            {formData.clothingItems.map((item) => {
              const itemInfo = clothingTypes.find(t => t.value === item.type);
              return (
                <Box key={item.type} className="selected-item">
                  <Text className="item-details">
                    {itemInfo?.label} x{item.quantity} = {(item.price * item.quantity).toLocaleString()}đ
                  </Text>
                  <Box className="quantity-controls">
                    <Button 
                      size="small" 
                      variant="secondary"
                      onClick={() => updateClothingQuantity(item.type, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <Text className="quantity">{item.quantity}</Text>
                    <Button 
                      size="small" 
                      variant="secondary"
                      onClick={() => updateClothingQuantity(item.type, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button 
                      size="small" 
                      variant="tertiary"
                      onClick={() => removeClothingItem(item.type)}
                    >
                      <Icon icon="zi-close" />
                    </Button>
                  </Box>
                </Box>
              );
            })}
            <Text className="total-amount">
              Tổng cộng: {formData.clothingItems.reduce((total, item) => total + (item.price * item.quantity), 0).toLocaleString()}đ
            </Text>
          </Box>
        )}
      </Box>

      {/* Order Details Section */}
      <Box className="info-card">
        <Text.Title size="medium" className="card-title">
          <Icon icon="zi-calendar" className="title-icon" />
          Chi tiết đơn hàng
        </Text.Title>

        <Box className="form-group">
          <Text className="form-label">Mã đơn hàng</Text>
          <Input
            placeholder="Mã tự động"
            value={formData.orderId}
            readOnly
            className="form-input order-id-readonly"
          />
        </Box>

        <Box className="form-group">
          <Text className="form-label">Thời gian nhận đồ *</Text>
          <Input
            type="datetime-local"
            value={formData.pickupTime}
            onChange={(e) => setFormData({...formData, pickupTime: e.target.value})}
            className="form-input"
          />
        </Box>

        <Box className="form-group">
          <Text className="form-label">Thời gian trả đồ mong muốn</Text>
          <Input
            type="datetime-local"
            value={formData.deliveryTime}
            onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
            className="form-input"
          />
        </Box>

        <Box className="form-group">
          <Text className="form-label">Ghi chú đặc biệt</Text>
          <Input.TextArea
            placeholder="Ví dụ: Không sử dụng nước xả, giặt riêng..."
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
          />
        </Box>
      </Box>

      {/* Pricing Info */}
      <Box className="info-card pricing-card">
        <Text.Title size="medium" className="card-title">
          <Icon icon="zi-dollar" className="title-icon" />
          Bảng giá tham khảo
        </Text.Title>
        
        <Grid cols={1} gap={12}>
          {clothingTypes.map((item) => {
            const isSelected = formData.clothingItems.some(selectedItem => selectedItem.type === item.value);
            return (
              <Box 
                key={item.value} 
                className={`price-item ${isSelected ? 'selected' : ''}`}
                onClick={() => addClothingItem(item.value)}
              >
                <Text className="item-name">{item.label}</Text>
                <Text className="item-price">{item.price.toLocaleString()}đ</Text>
              </Box>
            );
          })}
        </Grid>
        
        <Text size="xSmall" className="price-note">
          * Giá có thể thay đổi tùy theo tình trạng và loại vải
        </Text>
      </Box>

      {/* Submit Button */}
      <Box className="submit-section">
        <Button
          fullWidth
          variant="primary"
          size="large"
          className="submit-button"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Icon icon="zi-clock-1" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Icon icon="zi-check-circle" />
              Xác nhận đăng ký
            </>
          )}
        </Button>
        
        <Text size="xSmall" className="submit-note">
          Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút
        </Text>
      </Box>

      {/* Custom Toast */}
      {toast.show && (
        <Box className={`custom-toast ${toast.type}`}>
          <Text className="toast-message">{toast.message}</Text>
        </Box>
      )}
    </Page>
  );
}

export default RegisterPage;