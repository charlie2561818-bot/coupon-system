import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: 取得所有立牌位置
export async function GET() {
  try {
    const locations = await prisma.qrLocation.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // 取得所有進行中的活動供下拉選單使用
    const now = new Date();
    const activeCampaigns = await prisma.coupon.findMany({
      where: {
        status: 'ACTIVE',
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      select: {
        id: true,
        title: true,
        englishTitle: true,
        mode: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, locations, activeCampaigns });
  } catch (error) {
    console.error('QR Locations GET Error:', error);
    return NextResponse.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

// POST: 新增立牌位置
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, message: '請輸入立牌名稱' });
    }

    const location = await prisma.qrLocation.create({
      data: { 
        name: name.trim(),
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error('QR Locations POST Error:', error);
    return NextResponse.json({ success: false, message: '新增失敗' }, { status: 500 });
  }
}

// PUT: 更新立牌綁定
export async function PUT(request: NextRequest) {
  try {
    const { id, activeCampaignId } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: '缺少立牌 ID' });
    }

    const location = await prisma.qrLocation.update({
      where: { id },
      data: { 
        activeCampaignId: activeCampaignId || null,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error('QR Locations PUT Error:', error);
    return NextResponse.json({ success: false, message: '更新失敗' }, { status: 500 });
  }
}

// DELETE: 刪除立牌位置
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: '缺少立牌 ID' });
    }

    await prisma.qrLocation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('QR Locations DELETE Error:', error);
    return NextResponse.json({ success: false, message: '刪除失敗' }, { status: 500 });
  }
}
