import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Camera, Save, X, ArrowLeft } from 'lucide-react';
import { Card } from './ui/card';

export const Profile = ({ user, onUpdateProfile, isViewing = false, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.avatar || 'https://picsum.photos/seed/user/200'
  });

  // Sync form data when user changes
  useEffect(() => {
    if (user) {
      console.log('Profile user data:', user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || `https://picsum.photos/seed/${user.name || 'user'}/200`
      });
      setIsEditing(false);
    }
  }, [user?.id]);

  const handleSave = (e) => {
    e.preventDefault();
    console.log('Profile form data before save:', { user, formData });
    // Merge formData with original user object to preserve id, role, and other properties
    const updatedUser = { ...user, ...formData };
    console.log('Profile updated user object:', updatedUser);
    onUpdateProfile(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      avatar: user?.avatar || `https://picsum.photos/seed/${user?.name || 'user'}/200`
    });
    setIsEditing(false);
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 3MB - accounts for Base64 encoding overhead)
      if (file.size > 3 * 1024 * 1024) {
        alert('File size must be less than 3MB');
        return;
      }

      // Convert to Base64
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, avatar: event.target?.result });
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{isViewing ? 'Viewing: ' : ''}{user?.name}'s Profile</h2>
          <p className="text-slate-500 text-sm">{isViewing ? 'Student profile information' : 'Manage personal information and account settings'}</p>
        </div>
        {isViewing && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1 p-8 flex flex-col items-center text-center h-fit border-l-4 border-l-gold-500">
          <div className="relative group mb-6">
            <div 
              onClick={isEditing && !isViewing ? handleFileInputClick : undefined}
              className={`w-32 h-32 rounded-full overflow-hidden border-4 border-gold-400 shadow-2xl ${isEditing && !isViewing ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            >
              <img 
                src={formData.avatar} 
                alt={formData.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {isEditing && !isViewing && (
              <>
                <button 
                  type="button"
                  onClick={handleFileInputClick}
                  className="absolute bottom-0 right-0 p-2 bg-maroon-600 text-white rounded-full shadow-lg hover:bg-maroon-700 transition-colors"
                  title="Upload Picture"
                >
                  <Camera size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">{formData.name}</h3>
          <p className="text-xs font-bold text-maroon-600 uppercase tracking-widest mb-4">{user?.role}</p>
          <div className="w-full pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Mail size={16} className="text-slate-400" />
              <span className="truncate">{formData.email}</span>
            </div>
            {formData.phone && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span className="truncate">{formData.phone}</span>
              </div>
            )}
            {formData.address && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                <span className="truncate">{formData.address}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Edit Form */}
        <Card className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-bold text-slate-800">Personal Information</h4>
            {!isEditing && !isViewing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    disabled={!isEditing || isViewing}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm disabled:opacity-60"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    disabled={true} // Email usually not editable for security
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm opacity-60"
                    value={formData.email}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    disabled={!isEditing || isViewing}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm disabled:opacity-60"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Department</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    disabled={true}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm opacity-60"
                    value={user?.department}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Home Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                <textarea 
                  rows={3}
                  disabled={!isEditing || isViewing}
                  placeholder="Street, City, State, Zip Code"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm disabled:opacity-60 resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-maroon-600 text-white rounded-xl font-bold text-sm hover:bg-maroon-700 transition-colors shadow-lg shadow-maroon-100"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </motion.div>
  );
};

