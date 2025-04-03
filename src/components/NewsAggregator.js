import React from "react";

export default function NewsAggregator() {
  return (
    <div className="bg-gray-100">
      {/* Navbar */}
      <nav className="bg-gray-900 text-white py-4 px-8 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <h1 className="text-2xl font-bold">Newsphere</h1>
        <ul className="flex space-x-6">
          <li><a href="#" className="hover:text-gray-400">Home</a></li>
          <li><a href="#" className="hover:text-gray-400">Categories</a></li>
          <li><a href="#" className="hover:text-gray-400">Login</a></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <header className="bg-gradient-to-r from-orange-400 to-pink-500 text-white py-16 text-center">
        <h2 className="text-4xl font-bold">AI-Powered News Aggregator</h2>
        <p className="mt-2 text-lg">Your one-stop platform for trusted, real-time news updates.</p>
        <div className="mt-6 flex justify-center">
          <input
            type="text"
            placeholder="Search for news..."
            className="px-4 py-3 w-2/3 md:w-1/3 rounded-l-lg text-black"
          />
          <button className="bg-red-500 px-6 py-3 rounded-r-lg">Search</button>
        </div>
      </header>

      {/* News Categories */}
      <section className="container mx-auto my-10 px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Entertainment", color: "bg-red-100" },
            { title: "Technology", color: "bg-blue-100" },
            { title: "Business", color: "bg-yellow-100" },
            { title: "Health", color: "bg-green-100" },
            { title: "Stockmarket", color: "bg-purple-100" },
          ].map((category, index) => (
            <div key={index} className={`p-5 rounded-lg shadow-md ${category.color}`}>
              <h3 className="text-xl font-bold">{category.title}</h3>
              <p className="text-sm text-gray-600 mt-2">
                Latest news and updates in {category.title}.
              </p>
              <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Read More</button>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Box */}
      <section className="bg-orange-400 text-white text-center py-10">
        <h2 className="text-2xl font-semibold">Subscribe to Our Daily News Feed</h2>
        <div className="mt-4 flex justify-center">
          <input
            type="email"
            placeholder="Enter your email address"
            className="px-4 py-3 w-2/3 md:w-1/3 rounded-l-lg text-black"
          />
          <button className="bg-red-500 px-6 py-3 rounded-r-lg">Subscribe</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-5">
        <p>© 2025 Newsphere | <a href="#" className="text-orange-400">Terms of Service</a> | <a href="#" className="text-orange-400">Privacy Policy</a></p>
      </footer>
    </div>
  );
}

