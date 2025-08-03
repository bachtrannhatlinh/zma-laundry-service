import { openMiniApp } from "zmp-sdk";
import { Box, Button, Icon, Page, Text, Grid } from "zmp-ui";
import { useNavigate } from "react-router-dom";

import Clock from "../components/clock";
import Logo from "../components/logo";
import bg from "../static/bg.svg";
import banner from "../static/image/banner.png";

function HomePage() {
  const navigate = useNavigate();

  const services = [
    { icon: "zi-more-grid-2", title: "Giặt thường", desc: "Giặt sạch quần áo hàng ngày" },
    { icon: "zi-clock-1", title: "Giặt nhanh", desc: "Dịch vụ trong 24h" },
    { icon: "zi-star", title: "Giặt cao cấp", desc: "Chăm sóc đồ đắt tiền" },
    { icon: "zi-home", title: "Nhận tại nhà", desc: "Miễn phí nhận và giao" }
  ];

  return (
    <Page className="homepage">
      {/* Header Section */}
      <Box className="hero-section">
        <Box className="hero-banner">
          <img src={banner} alt="BTN Laundry Service Banner" className="banner-image" />
        </Box>
      </Box>

      {/* Services Section */}
      <Box className="services-section">
        <Text.Title size="large" className="section-title">Dịch vụ của chúng tôi</Text.Title>
        <Grid cols={1} gap={12}>
          {services.map((service, index) => (
            <Box key={index} className="service-card service-item-row">
              <Icon icon={service.icon} size={28} className="service-icon" />
              <Box className="service-content">
                <Text.Title size="small" className="service-title">{service.title}</Text.Title>
                <Text size="xSmall" className="service-desc">{service.desc}</Text>
              </Box>
            </Box>
          ))}
        </Grid>

        {/* Points History Link */}
        <Box 
          className="service-card service-item-row points-link" 
          onClick={() => navigate("/points-history")}
          style={{ marginTop: '16px', cursor: 'pointer' }}
        >
          <Icon icon="zi-star" size={28} className="service-icon" style={{ color: '#ffd700' }} />
          <Box className="service-content">
            <Text.Title size="small" className="service-title">Tích điểm thưởng</Text.Title>
            <Text size="xSmall" className="service-desc">Xem lịch sử điểm & ưu đãi</Text>
          </Box>
        </Box>
      </Box>

      {/* Features Section */}
      <Box className="features-section">
        <Text.Title size="medium" className="features-title">Tại sao chọn chúng tôi?</Text.Title>
        
        <Grid cols={1} gap={12} className="feature-list">
          <Box className="feature-item">
            <Icon icon="zi-check-circle" className="feature-icon" />
            <Box className="feature-content">
              <Text className="feature-text">Miễn phí nhận và giao tận nơi</Text>
              <Text size="xSmall" className="feature-desc">Phục vụ trong bán kính 5km</Text>
            </Box>
          </Box>
          
          <Box className="feature-item">
            <Icon icon="zi-check-circle" className="feature-icon" />
            <Box className="feature-content">
              <Text className="feature-text">Sử dụng hóa chất an toàn</Text>
              <Text size="xSmall" className="feature-desc">Không gây hại cho da và môi trường</Text>
            </Box>
          </Box>
          
          <Box className="feature-item">
            <Icon icon="zi-check-circle" className="feature-icon" />
            <Box className="feature-content">
              <Text className="feature-text">Giá cả minh bạch, hợp lý</Text>
              <Text size="xSmall" className="feature-desc">Không phát sinh chi phí ẩn</Text>
            </Box>
          </Box>
          
          <Box className="feature-item">
            <Icon icon="zi-check-circle" className="feature-icon" />
            <Box className="feature-content">
              <Text className="feature-text">Hỗ trợ khách hàng 24/7</Text>
              <Text size="xSmall" className="feature-desc">Luôn sẵn sàng giải đáp thắc mắc</Text>
            </Box>
          </Box>
        </Grid>
      </Box>

      {/* Footer Info */}
      <Box className="footer-info">
        <Text size="xSmall" className="contact-info">
          📞 Hotline: 0969897468
        </Text>
        <Text size="xSmall" className="contact-info">
          📍 Phục vụ toàn Đà Nẵng
        </Text>
      </Box>

      {/* Fixed CTA Button */}
      <Box className="home-cta-section">
        <Button
          variant="primary"
          fullWidth
          size="large"
          className="home-cta-button"
          onClick={() => navigate("/register")}
        >
          <Icon icon="zi-plus-circle" />
          Đăng ký dịch vụ ngay
        </Button>

        <Text size="xSmall" className="cta-note">
          Miễn phí nhận và giao trong bán kính 5km
        </Text>
      </Box>
    </Page>
  );
}

export default HomePage;

