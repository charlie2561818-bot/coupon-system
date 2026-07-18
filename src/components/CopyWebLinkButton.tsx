'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyWebLinkButtonProps {
  campaignId: string;
}

export default function CopyWebLinkButton({ campaignId }: CopyWebLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/claim/web/${campaignId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button 
      className="btn btn-outline" 
      onClick={handleCopy}
    >
      {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
      {copied ? '已複製！' : '複製網頁版連結'}
    </button>
  );
}
