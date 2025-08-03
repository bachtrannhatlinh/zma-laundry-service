import { useState, useEffect } from "react";
import { Box, Text, Icon, Spinner } from "zmp-ui";
import { laundryService } from "../services/api";

function PointsInfo({ phoneNumber, orderAmount = 0, showEstimate = false, onCustomerData }) {
  const [pointsData, setPointsData] = useState(null);
  const [estimatedPoints, setEstimatedPoints] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch customer points when phoneNumber changes
  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 10) {
      fetchCustomerPoints();
    } else {
      // Reset data when phone number is invalid
      setPointsData(null);
      setEstimatedPoints(null);
      setError(null);
      if (onCustomerData) {
        onCustomerData(null);
      }
    }
  }, [phoneNumber]);

  // Estimate points when orderAmount changes
  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 10 && orderAmount > 0 && showEstimate) {
      estimateOrderPoints();
    }
  }, [phoneNumber, orderAmount, showEstimate]);

  const fetchCustomerPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await laundryService.getCustomerPoints(phoneNumber);
      setPointsData(data);
      
      console.log('Customer data from API:', data); // Debug log
      
      // Callback với thông tin khách hàng để parent component sử dụng
      if (onCustomerData) {
        onCustomerData({
          fullName: data.fullName,
          address: data.address || "",
          isExisting: true
        });
      }
    } catch (err) {
      // Nếu customer chưa tồn tại, không hiển thị error
      if (err.message.includes('Không tìm thấy khách hàng')) {
        setPointsData(null);
        setError(null);
        
        // Callback báo khách hàng mới
        if (onCustomerData) {
          onCustomerData({
            fullName: "",
            address: "",
            isExisting: false
          });
        }
      } else {
        setError(err.message);
        setPointsData(null);
        
        if (onCustomerData) {
          onCustomerData(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const estimateOrderPoints = async () => {
    try {
      const data = await laundryService.estimatePoints(phoneNumber, orderAmount);
      setEstimatedPoints(data);
    } catch (err) {
      console.error('Error estimating points:', err);
      setEstimatedPoints(null);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Bronze':
        return '#CD7F32';
      case 'Silver':
        return '#C0C0C0';
      case 'Gold':
        return '#FFD700';
      case 'Platinum':
        return '#E5E4E2';
      default:
        return '#666';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'Bronze':
        return 'zi-star';
      case 'Silver':
        return 'zi-star';
      case 'Gold':
        return 'zi-star';
      case 'Platinum':
        return 'zi-crown';
      default:
        return 'zi-user';
    }
  };

  if (loading) {
    return (
      <Box className="points-info loading-state">
        <Box className="loading-header">
          <Spinner size="small" className="loading-spinner" />
          <Text.Title size="small" className="loading-title">Đang kiểm tra</Text.Title>
        </Box>
        <Text size="small" className="loading-message">
          Đang tải thông tin điểm thưởng và ưu đãi...
        </Text>
        <Box className="loading-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="points-info error-state">
        <Box className="error-header">
          <Icon icon="zi-warning" className="error-icon" />
          <Text.Title size="small" className="error-title">Lỗi kết nối</Text.Title>
        </Box>
        <Text size="small" className="error-message">
          Không thể tải thông tin điểm thưởng. Vui lòng thử lại sau.
        </Text>
      </Box>
    );
  }

  // Nếu khách hàng mới (chưa có trong hệ thống)
  if (!pointsData) {
    return (
      <Box className="points-info new-customer">
        <Box className="points-header">
          <Icon icon="zi-gift" className="points-icon" />
          <Text.Title size="small">Chào mừng khách hàng mới!</Text.Title>
        </Box>
        <Text size="small" className="welcome-text">
          🎉 Bạn sẽ nhận được điểm thưởng sau khi hoàn thành đơn hàng đầu tiên
        </Text>
        {estimatedPoints && (
          <Box className="estimated-points">
            <Text size="small">
              💫 Đơn hàng này sẽ tích được: <strong>{estimatedPoints.estimatedPoints} điểm</strong>
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box className="points-info existing-customer">
      <Box className="points-header">
        <Icon 
          icon={getLevelIcon(pointsData.memberLevel)} 
          className="level-icon"
          style={{ color: getLevelColor(pointsData.memberLevel) }}
        />
        <Box className="customer-info">
          <Text.Title size="small">{pointsData.fullName}</Text.Title>
          <Text size="xSmall" className="level-badge" style={{ color: getLevelColor(pointsData.memberLevel) }}>
            Hạng {pointsData.memberLevel}
          </Text>
        </Box>
      </Box>

      <Box className="points-display">
        <Box className="current-points">
          <Icon icon="zi-star" className="star-icon" />
          <Text className="points-value">{pointsData.loyaltyPoints.toLocaleString()}</Text>
          <Text size="xSmall" className="points-label">điểm hiện tại</Text>
        </Box>

        {estimatedPoints && showEstimate && (
          <Box className="estimated-points">
            <Icon icon="zi-plus" className="plus-icon" />
            <Text className="estimated-value">+{estimatedPoints.estimatedPoints}</Text>
            <Text size="xSmall" className="estimated-label">điểm từ đơn này</Text>
          </Box>
        )}
      </Box>

      {pointsData.nextLevelRequirement && (
        <Box className="level-progress">
          <Text size="xSmall" className="progress-text">
            Còn {pointsData.nextLevelRequirement.remainingAmount.toLocaleString()}đ để lên hạng {pointsData.nextLevelRequirement.nextLevel}
          </Text>
          <Box className="progress-bar">
            <Box 
              className="progress-fill"
              style={{ 
                width: `${pointsData.nextLevelRequirement.progress}%`,
                backgroundColor: getLevelColor(pointsData.nextLevelRequirement.nextLevel)
              }}
            />
          </Box>
        </Box>
      )}

      <Text size="xSmall" className="points-note">
        💡 Quy tắc: 1 điểm = 10,000đ | Hạng {pointsData.memberLevel} x{getMultiplier(pointsData.memberLevel)} điểm
      </Text>
    </Box>
  );
}

function getMultiplier(level) {
  switch (level) {
    case 'Silver': return 1.2;
    case 'Gold': return 1.5;
    case 'Platinum': return 2;
    default: return 1;
  }
}

export default PointsInfo;
