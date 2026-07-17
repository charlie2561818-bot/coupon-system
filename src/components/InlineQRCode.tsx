'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function InlineQRCode({ code }: { code: string }) {
  return (
    <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '12px', display: 'inline-block' }}>
      <QRCodeSVG 
        value={code}
        size={180}
        level={"H"}
        includeMargin={true}
        bgColor={"#ffffff"}
        fgColor={"#1a2e1a"}
      />
    </div>
  );
}
