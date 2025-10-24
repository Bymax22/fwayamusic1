"use client";
import { useState } from 'react';
import { Smartphone, Laptop, Speaker, Tv, Watch, QrCode, Wifi, Bluetooth } from 'lucide-react';

interface Device {
  id: number;
  name: string;
  type: 'phone' | 'laptop' | 'speaker' | 'tv' | 'watch';
  isConnected: boolean;
  lastConnected?: string;
}

export default function ConnectDevicePage() {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: 1,
      name: "iPhone 14 Pro",
      type: 'phone',
      isConnected: true,
      lastConnected: new Date().toISOString()
    },
    {
      id: 2,
      name: "MacBook Pro",
      type: 'laptop',
      isConnected: false,
      lastConnected: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      id: 3,
      name: "Living Room Speaker",
      type: 'speaker',
      isConnected: false
    },
    {
      id: 4,
      name: "Samsung Smart TV",
      type: 'tv',
      isConnected: false
    },
    {
      id: 5,
      name: "Apple Watch",
      type: 'watch',
      isConnected: false
    }
  ]);

  const [showQR, setShowQR] = useState(false);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Smartphone className="w-6 h-6" />;
      case 'laptop': return <Laptop className="w-6 h-6" />;
      case 'speaker': return <Speaker className="w-6 h-6" />;
      case 'tv': return <Tv className="w-6 h-6" />;
      case 'watch': return <Watch className="w-6 h-6" />;
      default: return <Smartphone className="w-6 h-6" />;
    }
  };

  const getDeviceTypeColor = (type: string) => {
    switch (type) {
      case 'phone': return 'bg-blue-500';
      case 'laptop': return 'bg-purple-500';
      case 'speaker': return 'bg-green-500';
      case 'tv': return 'bg-red-500';
      case 'watch': return 'bg-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  const toggleDeviceConnection = (deviceId: number) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, isConnected: !device.isConnected }
        : device
    ));
  };

  const disconnectAll = () => {
    setDevices(prev => prev.map(device => ({ ...device, isConnected: false })));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Connect Device</h1>
        <p className="text-gray-400">Stream music to your devices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Devices */}
        <div className="bg-[#0a3747]/70 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Available Devices</h2>
            <button 
              onClick={disconnectAll}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Disconnect All
            </button>
          </div>

          <div className="space-y-4">
            {devices.map(device => (
              <div 
                key={device.id} 
                className="flex items-center justify-between p-4 bg-[#0a3747] rounded-lg hover:bg-[#0a3747]/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${getDeviceTypeColor(device.type)} rounded-xl flex items-center justify-center text-white`}>
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{device.name}</p>
                    <p className="text-sm text-gray-400 capitalize">{device.type}</p>
                    {device.lastConnected && (
                      <p className="text-xs text-gray-500">
                        Last connected: {new Date(device.lastConnected).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => toggleDeviceConnection(device.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    device.isConnected
                      ? 'bg-[#e51f48] hover:bg-[#ff4d6d] text-white'
                      : 'bg-[#0a1f29] hover:bg-[#0a3747] text-gray-300'
                  }`}
                >
                  {device.isConnected ? 'Connected' : 'Connect'}
                </button>
              </div>
            ))}
          </div>

          {/* No Devices Found */}
          {devices.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Bluetooth className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No devices found</p>
              <p className="text-sm">Make sure your devices are on the same network</p>
            </div>
          )}
        </div>

        {/* Connection Methods */}
        <div className="space-y-6">
          {/* QR Code Connection */}
          <div className="bg-[#0a3747]/70 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quick Connect</h2>
            <div className="text-center">
              <div 
                className="w-48 h-48 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setShowQR(true)}
              >
                {showQR ? (
                  <div className="text-center p-4">
                    <div className="w-32 h-32 bg-black mx-auto mb-2 flex items-center justify-center text-white text-xs">
                      QR Code
                    </div>
                    <p className="text-black text-sm">Scan to connect</p>
                  </div>
                ) : (
                  <QrCode className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-[#e51f48] hover:text-[#ff4d6d] transition-colors"
              >
                {showQR ? 'Hide QR Code' : 'Show QR Code'}
              </button>
            </div>
          </div>

          {/* Connection Info */}
          <div className="bg-[#0a3747]/70 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Connection Guide</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-[#e51f48]" />
                <div>
                  <p className="text-white font-medium">Wi-Fi Network</p>
                  <p className="text-gray-400 text-sm">Ensure devices are on the same network</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Bluetooth className="w-5 h-5 text-[#e51f48]" />
                <div>
                  <p className="text-white font-medium">Bluetooth</p>
                  <p className="text-gray-400 text-sm">Pair devices via Bluetooth for direct connection</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-[#e51f48]" />
                <div>
                  <p className="text-white font-medium">QR Code</p>
                  <p className="text-gray-400 text-sm">Scan QR code with your mobile device</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Connection Status */}
          <div className="bg-[#0a3747]/70 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Current Connection</h2>
            {devices.find(d => d.isConnected) ? (
              <div className="space-y-3">
                {devices.filter(d => d.isConnected).map(device => (
                  <div key={device.id} className="flex items-center gap-3 p-3 bg-green-500/20 rounded-lg">
                    <div className={`w-8 h-8 ${getDeviceTypeColor(device.type)} rounded-lg flex items-center justify-center text-white`}>
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{device.name}</p>
                      <p className="text-green-400 text-sm">Connected • Streaming ready</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                <p>No active connections</p>
                <p className="text-sm">Connect a device to start streaming</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}