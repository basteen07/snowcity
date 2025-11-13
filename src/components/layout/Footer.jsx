import React from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/images/Logo.webp"; // ✅ Correct path

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src={Logo}
                alt="SnowCity"
                className="h-9 w-auto object-contain"
              />
              <h3 className="text-white font-semibold text-lg">SnowCity</h3>
            </div>
            <p className="text-sm text-gray-400">
              Experience the magic of snow and fun in the city’s coolest
              attraction!
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-lg border-b border-gray-700 pb-2">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-blue-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/attractions" className="hover:text-blue-300">
                  Attractions
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-blue-300">
                  Offers
                </Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-blue-300">
                  Book Tickets
                </Link>
              </li>
            </ul>
          </div>

          {/* Visitor Guide */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-lg border-b border-gray-700 pb-2">
              Visitor Guide
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/page/faq" className="hover:text-blue-300">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/page/safety" className="hover:text-blue-300">
                  Safety Rules
                </Link>
              </li>
              <li>
                <Link to="/page/dresscode" className="hover:text-blue-300">
                  Dress Code
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-lg border-b border-gray-700 pb-2">
              Information
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/page/about-us" className="hover:text-blue-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-300">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/page/privacy-policy" className="hover:text-blue-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/page/terms-and-conditions"
                  className="hover:text-blue-300"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between">
          <div>
            © {new Date().getFullYear()} SnowCity. All rights reserved.
          </div>
          <div className="flex gap-4 mt-3 md:mt-0">
            <Link to="/page/privacy-policy">Privacy</Link>
            <Link to="/page/terms-and-conditions">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
