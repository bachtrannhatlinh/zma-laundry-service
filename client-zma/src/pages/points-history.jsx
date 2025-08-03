import { useState, useEffect } from "react";
import { Box, Button, Input, Page, Text, Header, Icon, useNavigate } from "zmp-ui";
import { laundryService } from "../services/api";

function PointsHistoryPage() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPointsHistory = async () => {
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Vui lòng nhập số điện thoại hợp lệ");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await laundryService.getCustomerPoints(phoneNumber);
      setPointsData(data);
    } catch (err) {
      console.error('API error:', err);
      setError(err.message);
      setPointsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }
    fetchPointsHistory();
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Bronze': return '#CD7F32';
      case 'Silver': return '#C0C0C0';
      case 'Gold': return '#FFD700';
      case 'Platinum': return '#E5E4E2';
      default: return '#666';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Page className="points-history-page">
      <Header title="Lịch sử tích điểm" showBackIcon={true} />
      
      <Box style={{ height: '16px' }}></Box>

      {/* Search Section */}
      <Box className="info-card">
        <Text.Title size="medium" className="card-title">
          <Icon icon="zi-search" className="title-icon" />
          Tra cứu điểm thưởng
        </Text.Title>
        
        <form onSubmit={handleSubmit}>
          <Box className="form-group">
            <Text className="form-label">Số điện thoại *</Text>
            <Input
              type="tel"
              placeholder="0xxx xxx xxx"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="form-input"
            />
          </Box>
          
          <Button
            fullWidth
            variant="primary"
            htmlType="submit"
            disabled={loading}
            className="search-button"
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Icon icon="zi-clock-1" />
                Đang tìm...
              </>
            ) : (
              <>
                <Icon icon="zi-search" />
                Tra cứu điểm
              </>
            )}
          </Button>
        </form>
      </Box>

      {/* Error Message */}
      {error && (
        <Box className="info-card error-card">
          <Icon icon="zi-warning" />
          <Text className="error-message">{error}</Text>
        </Box>
      )}

      {/* Points Summary */}
      {pointsData && (
        <>
          <Box className="info-card">
            <Text.Title size="medium" className="card-title">
              <Icon icon="zi-user" className="title-icon" />
              Thông tin khách hàng
            </Text.Title>
            
            <Box className="customer-summary">
              <Box className="customer-header">
                <Box className="customer-info">
                  <Text.Title size="small">{pointsData.fullName}</Text.Title>
                  <Text size="small" className="phone-number">{pointsData.phoneNumber}</Text>
                </Box>
                <Box 
                  className="member-badge"
                  style={{ backgroundColor: getLevelColor(pointsData.memberLevel) }}
                >
                  <Text size="xSmall" className="badge-text">
                    {pointsData.memberLevel}
                  </Text>
                </Box>
              </Box>
              
              <Box className="points-summary">
                <Box className="summary-item">
                  <Icon icon="zi-star" />
                  <Box className="summary-content">
                    <Text className="summary-value">{pointsData.loyaltyPoints.toLocaleString()}</Text>
                    <Text size="xSmall" className="summary-label">Điểm hiện tại</Text>
                  </Box>
                </Box>
                
                <Box className="summary-item">
                  <Icon icon="zi-dollar" />
                  <Box className="summary-content">
                    <Text className="summary-value">{pointsData.totalSpent.toLocaleString()}đ</Text>
                    <Text size="xSmall" className="summary-label">Tổng chi tiêu</Text>
                  </Box>
                </Box>
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
            </Box>
          </Box>

          {/* Points History */}
          <Box className="info-card">
            <Text.Title size="medium" className="card-title">
              <Icon icon="zi-clock-1" className="title-icon" />
              Lịch sử giao dịch điểm
            </Text.Title>
            
            {pointsData.pointsHistory && pointsData.pointsHistory.length > 0 ? (
              <Box className="history-list">
                {pointsData.pointsHistory.map((transaction, index) => (
                  <Box key={index} className="history-item">
                    <Box className="history-main">
                      <Box className="history-info">
                        <Text className="history-description">{transaction.description}</Text>
                        <Text size="xSmall" className="history-date">
                          {formatDate(transaction.createdAt)}
                        </Text>
                        <Text size="xSmall" className="history-order">
                          Đơn hàng: {transaction.orderId}
                        </Text>
                      </Box>
                      
                      <Box className="history-points">
                        {transaction.pointsEarned > 0 && (
                          <Text className="points-earned">
                            +{transaction.pointsEarned}
                          </Text>
                        )}
                        {transaction.pointsUsed > 0 && (
                          <Text className="points-used">
                            -{transaction.pointsUsed}
                          </Text>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box className="empty-history">
                <Icon icon="zi-clock-1" />
                <Text>Chưa có giao dịch nào</Text>
              </Box>
            )}
          </Box>

          {/* Points Rules */}
          <Box className="info-card">
            <Text.Title size="medium" className="card-title">
              <Icon icon="zi-info-circle" className="title-icon" />
              Quy tắc tích điểm
            </Text.Title>
            
            <Box className="rules-content">
              <Box className="rule-item">
                <Icon icon="zi-star" />
                <Text size="small">1 điểm = 10,000đ chi tiêu</Text>
              </Box>
              
              <Box className="rule-item">
                <Icon icon="zi-crown" />
                <Text size="small">Hạng Bronze: x1 điểm</Text>
              </Box>
              
              <Box className="rule-item">
                <Icon icon="zi-crown" />
                <Text size="small">Hạng Silver: x1.2 điểm (từ 500k)</Text>
              </Box>
              
              <Box className="rule-item">
                <Icon icon="zi-crown" />
                <Text size="small">Hạng Gold: x1.5 điểm (từ 2tr)</Text>
              </Box>
              
              <Box className="rule-item">
                <Icon icon="zi-crown" />
                <Text size="small">Hạng Platinum: x2 điểm (từ 5tr)</Text>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Page>
  );
}

export default PointsHistoryPage;
