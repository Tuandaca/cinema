const fs = require('fs');
const path = require('path');

const phases = [
  { id: 1, name: 'System Design & Setup', viName: 'Thiết kế Hệ thống & Cài đặt' },
  { id: 2, name: 'Authentication & Backend Core', viName: 'Xác thực & Nhân Backend' },
  { id: 3, name: 'Movie & Showtime Module', viName: 'Module Phim & Suất chiếu' },
  { id: 4, name: 'Seat Booking System (Real-time)', viName: 'Hệ thống Đặt ghế (Real-time)' },
  { id: 5, name: 'Order & Payment Integration', viName: 'Tích hợp Đơn hàng & Thanh toán' },
  { id: 6, name: 'AI Assistant & Recommendation', viName: 'Trợ lý AI & Gợi ý' },
  { id: 7, name: 'Admin Dashboard', viName: 'Trang quản trị (Admin)' },
  { id: 8, name: 'Deployment & Optimization', viName: 'Triển khai & Tối ưu hóa' },
];

phases.forEach(phase => {
  const dir = path.join(__dirname, 'plan', `phase${phase.id}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const planContent = `# Phase ${phase.id}: ${phase.name}\n# Giai đoạn ${phase.id}: ${phase.viName}\n\n## 📝 Description (Mô tả)\nDetailed planning for ${phase.name}.\n\n## 🚀 Goals (Mục tiêu)\n- Item 1\n- Item 2\n`;
  const checklistContent = `# Checklist Phase ${phase.id}: ${phase.viName}\n\n- [ ] Task 1\n- [ ] Task 2\n`;

  fs.writeFileSync(path.join(dir, 'plan.md'), planContent);
  fs.writeFileSync(path.join(dir, 'checklist.md'), checklistContent);
});

console.log('✅ Scaffolding complete!');
