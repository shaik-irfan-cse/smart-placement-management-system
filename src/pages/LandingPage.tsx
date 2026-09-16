import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, Users, Briefcase, CheckCircle, ArrowRight, Shield, BarChart3, Bell, Clock, Globe, Award } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SPMS</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#stats" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Statistics</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Login</button>
            <button onClick={() => navigate('/login/student')} className="btn-primary text-sm">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-700 text-sm font-medium mb-6">
              <Award className="w-4 h-4" />
              Campus Placement Made Simple
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Smart Placement<br />
              <span className="text-indigo-600">Management System</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              One platform for students, colleges and recruiters to manage campus placements efficiently.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate('/login/student')} className="btn-primary text-base px-8 py-3 flex items-center gap-2">
                Student Login <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/login/admin')} className="btn-secondary text-base px-8 py-3">
                Admin Portal
              </button>
              <button onClick={() => navigate('/login/recruiter')} className="btn-secondary text-base px-8 py-3">
                Recruiter Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Choose Your Role</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Select how you want to use the platform</p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Student Card */}
            <div className="card group hover:border-indigo-200 transition-all duration-300">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-600 transition-colors">
                <GraduationCap className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Student</h3>
              <ul className="space-y-2 mb-6">
                {['Explore job opportunities', 'Check eligibility', 'Apply for jobs', 'Take technical assessments', 'Track applications'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login/student')} className="w-full btn-primary flex items-center justify-center gap-2">
                Student Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Card */}
            <div className="card group hover:border-indigo-200 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 transition-colors">
                <Shield className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">College Admin</h3>
              <ul className="space-y-2 mb-6">
                {['Manage students', 'Approve companies', 'Monitor placement drives', 'Track applications', 'View placement statistics'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login/admin')} className="w-full btn-primary flex items-center justify-center gap-2">
                Admin Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Recruiter Card */}
            <div className="card group hover:border-indigo-200 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-purple-600 transition-colors transition-colors">
                <Building2 className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Recruiter / HR</h3>
              <ul className="space-y-2 mb-6">
                {['Create job drives', 'Define eligibility', 'View candidates', 'Review applications', 'Select or reject candidates'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login/recruiter')} className="w-full btn-primary flex items-center justify-center gap-2">
                Recruiter Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">A streamlined process from job posting to placement</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Building2 className="w-6 h-6" />, title: 'Company Registers', desc: 'Recruiter creates an account and gets admin approval' },
              { icon: <Briefcase className="w-6 h-6" />, title: 'Job Drive Created', desc: 'Company posts job with eligibility criteria and requirements' },
              { icon: <Users className="w-6 h-6" />, title: 'Students Apply', desc: 'Eligible students apply and take technical assessments' },
              { icon: <Award className="w-6 h-6" />, title: 'Selection & Placement', desc: 'Recruiter reviews candidates and makes selections' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-indigo-600 mb-2">STEP {i + 1}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">Everything you need to manage campus placements</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Bell className="w-6 h-6" />, title: 'Real-time Notifications', desc: 'Stay updated with instant alerts for applications, results, and selections' },
              { icon: <Shield className="w-6 h-6" />, title: 'Role-based Access', desc: 'Secure access control for students, admins, and recruiters' },
              { icon: <BarChart3 className="w-6 h-6" />, title: 'Analytics Dashboard', desc: 'Comprehensive statistics and placement tracking' },
              { icon: <Clock className="w-6 h-6" />, title: 'Automated Testing', desc: 'Built-in technical assessment with auto-evaluation' },
              { icon: <CheckCircle className="w-6 h-6" />, title: 'Eligibility Checks', desc: 'Automatic verification before application submission' },
              { icon: <Globe className="w-6 h-6" />, title: 'Responsive Design', desc: 'Works seamlessly on desktop, tablet, and mobile' },
            ].map((feature, i) => (
              <div key={i} className="card">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Placement Statistics</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">Our track record speaks for itself</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: '95%', label: 'Placement Rate', color: 'text-green-600' },
              { value: '150+', label: 'Companies Visited', color: 'text-indigo-600' },
              { value: '₹12 LPA', label: 'Highest Package', color: 'text-purple-600' },
              { value: '2,500+', label: 'Students Placed', color: 'text-blue-600' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 card">
                <div className={`text-3xl sm:text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">SPMS</span>
              </div>
              <p className="text-sm text-gray-400">Smart Placement Management System for modern colleges.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => navigate('/login/student')} className="hover:text-white transition-colors">Student Portal</button></li>
                <li><button onClick={() => navigate('/login/admin')} className="hover:text-white transition-colors">Admin Portal</button></li>
                <li><button onClick={() => navigate('/login/recruiter')} className="hover:text-white transition-colors">Recruiter Portal</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span className="hover:text-white transition-colors cursor-pointer">Documentation</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">FAQ</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Support</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>placement@college.edu</li>
                <li>+91 98765 43210</li>
                <li>Training & Placement Cell</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 Smart Placement Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
