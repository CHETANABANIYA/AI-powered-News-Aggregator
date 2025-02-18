import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} NewsSphere | <a href="#">Privacy Policy</a>
      </p>
    </footer>
  );
};

export default Footer;