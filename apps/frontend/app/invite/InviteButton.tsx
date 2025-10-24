"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiUserAdd, 
  HiOutlineClipboard, 
  HiOutlineMail,
  HiOutlineShare,
  HiCheck
} from "react-icons/hi";
import {
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
 
  FaTelegram
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

interface ReferralData {
  code: string;
  invites: number;
  earned: number;
  pending: number;
}

const InviteButton = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch referral data
  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setReferralData({
          code: "FWAYA" + Math.floor(1000 + Math.random() * 9000),
          invites: 12,
          earned: 45.50,
          pending: 15.25
        });
      } catch (error) {
        console.error("Failed to load referral data", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchReferralData();
    }
  }, [session]);

  const referralLink = `https://fwayamusic.com/signup?ref=${referralData?.code || "FWAYA"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
    
    // Track copy event
    trackEvent('referral_copy');
  };

  const shareMethods = [
    {
      name: "WhatsApp",
      icon: <FaWhatsapp className="text-green-500" size={20} />,
      action: () => {
        window.open(`https://wa.me/?text=Join%20Fwaya%20Music%20with%20my%20referral%20link:%20${referralLink}`);
        trackEvent('referral_share_whatsapp');
      }
    },
    {
      name: "Facebook",
      icon: <FaFacebook className="text-blue-600" size={20} />,
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`);
        trackEvent('referral_share_facebook');
      }
    },
    {
      name: "Twitter",
      icon: <FaTwitter className="text-blue-400" size={20} />,
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=Join%20Fwaya%20Music%20-%20the%20best%20Zambian%20music%20platform!%20${referralLink}`);
        trackEvent('referral_share_twitter');
      }
    },
    {
      name: "Telegram",
      icon: <FaTelegram className="text-blue-500" size={20} />,
      action: () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Check%20out%20Fwaya%20Music`);
        trackEvent('referral_share_telegram');
      }
    },
    {
      name: "Email",
      icon: <HiOutlineMail className="text-gray-600" size={20} />,
      action: () => {
        window.open(`mailto:?subject=Join%20Fwaya%20Music&body=Sign%20up%20using%20my%20referral%20link:%20${referralLink}`);
        trackEvent('referral_share_email');
      }
    }
  ];

  const trackEvent = (eventName: string) => {
    // Implement your analytics tracking here
    console.log(`Tracked: ${eventName}`);
    // Example: 
    // analytics.track(eventName, {
    //   userId: session?.user.id,
    //   referralCode: referralData?.code
    // });
  };

  if (!session) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 bg-[#e51f48] rounded-full text-white hover:bg-[#ff4d6d] transition-all relative"
        aria-label="Invite friends"
      >
        <HiUserAdd size={20} />
        {referralData && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#e51f48] text-[10px] font-bold rounded-full flex items-center justify-center">
            {referralData.invites}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-2 w-72 bg-[#0f2d3d] rounded-lg shadow-xl border border-[#1e293b] z-50 overflow-hidden"
          >
            <div className="p-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HiUserAdd size={18} />
                Invite Friends
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Earn ZMW 5 for each friend who joins and subscribes
              </p>

              {isLoading ? (
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-[#1a5a72] rounded animate-pulse"></div>
                  <div className="h-8 bg-[#1a5a72] rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="mt-4 bg-[#1a5a72] bg-opacity-30 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-300">Your Code:</span>
                      <span className="font-mono font-bold text-[#e51f48]">
                        {referralData?.code}
                      </span>
                    </div>
                    <div className="mt-2 flex">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 bg-[#0a3747] text-xs p-2 rounded-l text-gray-300 truncate"
                      />
                      <button
                        onClick={handleCopy}
                        className="bg-[#e51f48] hover:bg-[#ff4d6d] px-3 rounded-r flex items-center"
                      >
                        {copied ? (
                          <HiCheck size={16} className="text-white" />
                        ) : (
                          <HiOutlineClipboard size={16} className="text-white" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="bg-[#1a5a72] bg-opacity-30 p-2 rounded text-center">
                      <p className="text-xs text-gray-400">Earned</p>
                      <p className="font-bold text-[#e51f48]">
                        ZMW {referralData?.earned.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-[#1a5a72] bg-opacity-30 p-2 rounded text-center">
                      <p className="text-xs text-gray-400">Pending</p>
                      <p className="font-bold text-[#e51f48]">
                        ZMW {referralData?.pending.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-[#1e293b] p-3 bg-[#0a3747]">
              <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                <HiOutlineShare size={14} />
                Share via
              </h4>
              <div className="flex justify-around">
                {shareMethods.map((method) => (
                  <button
                    key={method.name}
                    onClick={method.action}
                    className="p-2 hover:bg-[#1a5a72] rounded-full transition-colors"
                    aria-label={`Share via ${method.name}`}
                  >
                    {method.icon}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InviteButton;