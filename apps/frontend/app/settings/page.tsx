"use client";
import { useState } from 'react';
import { 
  Settings, 
 
  Volume2, 
 
  Shield, 

  User
} from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<'general' | 'audio' | 'privacy' | 'account'>('general');
  const [settings, setSettings] = useState({
    // General
    theme: 'dark',
    language: 'en',
    autoPlay: true,
    // Audio
    audioQuality: 'high',
    crossfade: false,
    crossfadeDuration: 5,
    volumeNormalization: true,
    // Privacy
    explicitContent: true,
    listeningHistory: true,
    personalizedRecommendations: true,
    // Account
    emailNotifications: true,
    pushNotifications: true,
    twoFactorAuth: false
  });

  const handleSettingChange = (key: string, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const sections = [
    { id: 'general', label: 'General', icon: <Settings className="w-5 h-5" /> },
    { id: 'audio', label: 'Audio', icon: <Volume2 className="w-5 h-5" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-5 h-5" /> },
    { id: 'account', label: 'Account', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Settings className="w-8 h-8 text-[#e51f48]" />
          Settings
        </h1>
        <p className="text-gray-400">Customize your FwayaMusic experience</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 bg-[#0a3747]/70 rounded-xl p-4">
          <div className="space-y-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as 'general' | 'audio' | 'privacy' | 'account')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-[#e51f48] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#0a3747]'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-[#0a3747]/70 rounded-xl p-6">
          {activeSection === 'general' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">General Settings</h2>
              
              <div className="space-y-6">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Theme</p>
                    <p className="text-gray-400 text-sm">Choose your interface theme</p>
                  </div>
                  <select 
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    className="px-4 py-2 bg-[#0a3747] border border-[#0a3747] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Language</p>
                    <p className="text-gray-400 text-sm">Select your preferred language</p>
                  </div>
                  <select 
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="px-4 py-2 bg-[#0a3747] border border-[#0a3747] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>

                {/* Auto-play */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Auto-play</p>
                    <p className="text-gray-400 text-sm">Automatically play similar songs when your music ends</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.autoPlay}
                      onChange={(e) => handleSettingChange('autoPlay', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e51f48]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'audio' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Audio Settings</h2>
              
              <div className="space-y-6">
                {/* Audio Quality */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Audio Quality</p>
                    <p className="text-gray-400 text-sm">Streaming quality affects data usage</p>
                  </div>
                  <select 
                    value={settings.audioQuality}
                    onChange={(e) => handleSettingChange('audioQuality', e.target.value)}
                    className="px-4 py-2 bg-[#0a3747] border border-[#0a3747] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent"
                  >
                    <option value="low">Low (96 kbps)</option>
                    <option value="normal">Normal (160 kbps)</option>
                    <option value="high">High (320 kbps)</option>
                  </select>
                </div>

                {/* Crossfade */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Crossfade</p>
                    <p className="text-gray-400 text-sm">Smooth transition between songs</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.crossfade}
                      onChange={(e) => handleSettingChange('crossfade', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e51f48]"></div>
                  </label>
                </div>

                {settings.crossfade && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Crossfade Duration</p>
                      <p className="text-gray-400 text-sm">Seconds of overlap between songs</p>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="12" 
                      value={settings.crossfadeDuration}
                      onChange={(e) => handleSettingChange('crossfadeDuration', parseInt(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-white w-8 text-right">{settings.crossfadeDuration}s</span>
                  </div>
                )}

                {/* Volume Normalization */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Volume Normalization</p>
                    <p className="text-gray-400 text-sm">Keep consistent volume across all tracks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.volumeNormalization}
                      onChange={(e) => handleSettingChange('volumeNormalization', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e51f48]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Privacy Settings</h2>
              
              <div className="space-y-6">
                {/* Explicit Content */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Allow Explicit Content</p>
                    <p className="text-gray-400 text-sm">Show songs with explicit lyrics</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.explicitContent}
                      onChange={(e) => handleSettingChange('explicitContent', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e51f48]"></div>
                  </label>
                </div>

                {/* Listening History */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Listening History</p>
                    <p className="text-gray-400 text-sm">Save your played tracks and playlists</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.listeningHistory}
                      onChange={(e) => handleSettingChange('listeningHistory', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e51f48]"></div>
                  </label>
                </div>

                {/* Personalized Recommendations */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Personalized Recommendations</p>
                    <p className="text-gray-400 text-sm">Get recommendations based on your listening habits</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.personalizedRecommendations}
                      onChange={(e) => handleSettingChange('personalizedRecommendations', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e51f48]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
              
              <div className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-gray-400 text-sm">Receive updates and recommendations via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e51f48]"></div>
                  </label>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Push Notifications</p>
                    <p className="text-gray-400 text-sm">Receive notifications on your devices</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e51f48]"></div>
                  </label>
                </div>

                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Two-Factor Authentication</p>
                    <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e51f48]"></div>
                  </label>
                </div>

                {/* Account Actions */}
                <div className="pt-6 border-t border-[#0a3747]">
                  <h3 className="text-lg font-bold text-white mb-4">Account Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-[#0a3747] hover:bg-[#0a3747]/80 rounded-lg text-white transition-colors">
                      Change Password
                    </button>
                    <button className="w-full text-left p-3 bg-[#0a3747] hover:bg-[#0a3747]/80 rounded-lg text-white transition-colors">
                      Download Your Data
                    </button>
                    <button className="w-full text-left p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}