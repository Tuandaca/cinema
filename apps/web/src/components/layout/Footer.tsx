import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-coicine-ebony pt-20 pb-10 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <span className="text-3xl font-headline font-bold text-coicine-gold tracking-tighter">
                COI<span className="text-white">CINE</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              The next generation of cinema experience. Powered by AI, designed for movie lovers.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-white/5 hover:bg-coicine-gold hover:text-black rounded-full transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="p-2 bg-white/5 hover:bg-coicine-gold hover:text-black rounded-full transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="p-2 bg-white/5 hover:bg-coicine-gold hover:text-black rounded-full transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="p-2 bg-white/5 hover:bg-coicine-gold hover:text-black rounded-full transition-all">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-white font-bold mb-6">CoiCine</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-coicine-gold transition-colors">About Us</Link></li>
              <li><Link href="/cinemas" className="hover:text-coicine-gold transition-colors">Our Cinemas</Link></li>
              <li><Link href="/careers" className="hover:text-coicine-gold transition-colors">Careers</Link></li>
              <li><Link href="/news" className="hover:text-coicine-gold transition-colors">News & Events</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/faq" className="hover:text-coicine-gold transition-colors">FAQ</Link></li>
              <li><Link href="/privacy" className="hover:text-coicine-gold transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-coicine-gold transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-coicine-gold transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* App Download */}
          <div>
            <h4 className="text-white font-bold mb-6">Experience on Mobile</h4>
            <p className="text-gray-400 text-sm mb-6">Download our app for better experience and exclusive offers.</p>
            <div className="space-y-3">
              <div className="h-12 bg-white/10 rounded-lg flex items-center px-4 gap-3 cursor-pointer hover:bg-white/15 transition-colors border border-white/5">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-black transform rotate-45"></div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 leading-none">Download on the</div>
                  <div className="text-xs font-bold">App Store</div>
                </div>
              </div>
              <div className="h-12 bg-white/10 rounded-lg flex items-center px-4 gap-3 cursor-pointer hover:bg-white/15 transition-colors border border-white/5">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 leading-none">Get it on</div>
                  <div className="text-xs font-bold">Google Play</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-xs">
            © 2026 CoiCine Corporation. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-gray-500">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
