import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { showToast } from '../components/UI';
import { UserRole } from '../types';

export function LoginPage() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const roleConfig: Record<string, { title: string; subtitle: string; placeholder: string; color: string }> = {
    student: { title: 'Student Login', subtitle: 'Access your placement portal', placeholder: 'Roll Number / Email', color: 'indigo' },
    admin: { title: 'Admin Login', subtitle: 'Manage the placement system', placeholder: 'Employee ID / Email', color: 'blue' },
    recruiter: { title: 'Recruiter Login', subtitle: 'Access your company portal', placeholder: 'Email / Username', color: 'purple' },
  };

  const config = roleConfig[role || 'student'] || roleConfig.student;
  const userRole = (role || 'student') as UserRole;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      if (result.success) {
        showToast('Login successful!', 'success');
        navigate(`/${userRole}/dashboard`);
      } else {
        showToast(result.message, 'error');
      }
      setLoading(false);
    }, 500);
  };

  const demoCredentials: Record<string, { email: string; password: string }> = {
    student: { email: 'arjun@college.edu', password: 'pass123' },
    admin: { email: 'admin@college.edu', password: 'admin123' },
    recruiter: { email: 'hr@tcs.com', password: 'pass123' },
  };

  const fillDemo = () => {
    const creds = demoCredentials[role || 'student'];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">SPMS</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-gray-500 mt-1">{config.subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.placeholder}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Forgot password?
              </button>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-center">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
            <button onClick={fillDemo} className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
              📋 Fill demo credentials for testing
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to={`/signup/${role || 'student'}`} className="text-indigo-600 font-medium hover:text-indigo-700">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          {(['student', 'admin', 'recruiter'] as const).map(r => (
            <Link key={r} to={`/login/${r}`} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${role === r ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();
  const { signup } = useApp();
  const userRole = (role || 'student') as UserRole;

  const [formData, setFormData] = useState<any>({
    email: '', password: '', confirmPassword: '',
    name: '', rollNumber: '', phone: '', dob: '', branch: 'CSE', year: 4, cgpa: '',
    companyName: '', recruiterName: '', address: '', website: '', description: '',
    skills: '',
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = signup(formData.email, formData.password, userRole, {
        ...formData,
        cgpa: parseFloat(formData.cgpa) || 0,
        skills: formData.skills ? formData.skills.split(',').map((s: string) => s.trim()) : [],
      });
      if (result.success) {
        showToast('Registration successful!', 'success');
        navigate(`/${userRole}/dashboard`);
      } else {
        showToast(result.message, 'error');
      }
      setLoading(false);
    }, 500);
  };

  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">SPMS</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {userRole === 'student' ? 'Student' : userRole === 'admin' ? 'Admin' : 'Recruiter'} Registration
          </h1>
          <p className="text-gray-500 mt-1">Create your account to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {userRole === 'student' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <input type="text" value={formData.rollNumber} onChange={e => updateField('rollNumber', e.target.value)} className="input-field" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                    <select value={formData.branch} onChange={e => updateField('branch', e.target.value)} className="input-field">
                      {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
                    <input type="number" step="0.01" min="0" max="10" value={formData.cgpa} onChange={e => updateField('cgpa', e.target.value)} className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                  <input type="text" value={formData.skills} onChange={e => updateField('skills', e.target.value)} className="input-field" placeholder="Java, Python, React" />
                </div>
              </>
            )}

            {userRole === 'recruiter' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input type="text" value={formData.companyName} onChange={e => updateField('companyName', e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recruiter Name</label>
                    <input type="text" value={formData.recruiterName} onChange={e => updateField('recruiterName', e.target.value)} className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" value={formData.website} onChange={e => updateField('website', e.target.value)} className="input-field" />
                </div>
              </>
            )}

            {userRole === 'admin' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                    <input type="text" value={formData.rollNumber} onChange={e => updateField('rollNumber', e.target.value)} className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} className="input-field" required />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} className="input-field" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} className="input-field" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-center mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to={`/login/${role || 'student'}`} className="text-indigo-600 font-medium hover:text-indigo-700">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
