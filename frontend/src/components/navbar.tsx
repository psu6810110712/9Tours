import React from 'react';
import './navbar.css'; // ดึงไฟล์ CSS เข้ามาทำงาน

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      
      {/* โลโก้ */}
      <div className="navbar-logo">
        <span className="logo-blue">9</span>
        <span className="logo-yellow">Tours</span>
      </div>

      {/* เมนูหลัก */}
      <div className="navbar-menu">
        <a href="#" className="nav-link active">หน้าแรก</a>
        <a href="#" className="nav-link">วันเดย์ทริป</a>
        <a href="#" className="nav-link">เที่ยวพร้อมที่พัก</a>
      </div>

      {/* การจอง & โปรไฟล์ */}
      <div className="navbar-right">
        <a href="#" className="nav-link">การจองของฉัน</a>
        
        {/* ไอคอนโปรไฟล์ */}
        <div className="profile-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

    </nav>
  );
};

export default Navbar;