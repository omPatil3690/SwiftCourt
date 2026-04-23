import React from 'react';
import { motion } from 'framer-motion';
import ImageCarousel from '../components/ImageCarousel';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { CheckCircle2, Users, Shield, Trophy, Sparkles } from 'lucide-react';

const heroImages = [
  'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1601584115197-04ecc0da28d9?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1200&q=60'
];

const values = [
  { icon: <Users className="h-6 w-6" />, title: 'Community First', desc: 'Connecting players, owners, and trainers into a thriving ecosystem.' },
  { icon: <Shield className="h-6 w-6" />, title: 'Trust & Safety', desc: 'Secure bookings, verified venues, fair policies, transparent reviews.' },
  { icon: <Trophy className="h-6 w-6" />, title: 'Healthy Competition', desc: 'Gamified loyalty, badges & streaks to stay active and engaged.' },
  { icon: <Sparkles className="h-6 w-6" />, title: 'Continuous Innovation', desc: 'Iterating fast on analytics, PWA, realtime, and performance features.' }
];

const milestones = [
  'Unified booking & training discovery flow',
  'Realtime court availability prototype',
  'Gamification layer: points, streaks, badges',
  'Referral & sharing infrastructure',
  'Robust admin & owner access controls'
];

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <SEO title="About QuickCourt" description="Learn about QuickCourt's mission and platform" path="/about" />
      {/* Hero */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 md:pt-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-green-600 to-emerald-500 bg-clip-text text-transparent">
                Play. Improve. Belong.
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="mt-6 text-gray-600 text-lg leading-relaxed">
                QuickCourt is building the connective tissue for local sports. We help players discover courts, owners manage facilities, and communities grow through smart scheduling, gamification, and delightful user experience.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="mt-8 flex flex-wrap gap-4">
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link to="/venues">Explore Venues</Link>
                </Button>
                <Button asChild variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </motion.div>
            </div>
            <div className="order-first lg:order-last">
              <ImageCarousel images={heroImages} venueName="About QuickCourt" />
            </div>
          </div>
        </div>
      </section>
      {/* Values */}
      <section className="mt-20 max-w-6xl mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                {v.icon}
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">{v.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Milestones */}
      <section className="mt-24 max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">What We've Built So Far</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">Relentless iteration has already produced a feature set that accelerates adoption and engagement.</p>
          <ul className="space-y-3">
            {milestones.map(m => (
              <li key={m} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {/* CTA Band */}
      <section className="mt-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-500 p-10 md:p-16">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Ready to Play Smarter?</h2>
              <p className="mt-4 text-green-50 text-lg leading-relaxed">Join a platform that rewards activity, simplifies management, and grows with your community.</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild className="bg-white text-green-700 hover:bg-green-50 font-semibold">
                  <Link to="/signup">Create Account</Link>
                </Button>
                <Button asChild variant="outline" className="border-white text-white hover:bg-white/10">
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
