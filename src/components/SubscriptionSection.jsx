import React, { useState } from 'react';

const SubscriptionSection = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setMessage('Thank you for subscribing!');
      setEmail('');
    } else {
      setMessage('Please enter a valid email address.');
    }
  };

  return (
    <section className="subscription-section">
      <h2>Subscribe to Our Daily News Feed</h2>
      <form className="subscription-form" onSubmit={handleSubscribe}>
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Subscribe</button>
      </form>
      {message && <p className="subscription-message">{message}</p>}
    </section>
  );
};

export default SubscriptionSection;