import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Carousel from './components/Carousel';
import NewsCategories from './components/NewsCategories';
import SubscriptionSection from './components/SubscriptionSection';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';

function App() {
  return (
    <Router>
      <Navbar />
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/login" component={Login} />
      </Switch>
      <HeroSection />
      <Carousel />
      <NewsCategories />
      <SubscriptionSection />
      <Footer />
    </Router>
  );
}

export default App;

