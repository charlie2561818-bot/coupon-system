import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return false;
  }
  return true;
}

// GET: 取得所有立牌位置
export async function GET() {
  try {
    if (!(await checkAdminAuth())) {
      return NextResponse.json({ success: false, message: '權限不足' }, { status: 403 });
    }

    // Ensure LINE_LIFF exists
    let lineLiff = await prisma.qrLocation.findUnique({ where: { id: 'LINE_LIFF' } });
    if (!lineLiff) {
      lineLiff = await prisma.qrLocation.create({
        data: {
          id: 'LINE_LIFF',
          name: '📱 LINE 官方帳號圖文選單',
          updatedAt: new Date(),
        }
      });
    }

    const locations = await prisma.qrLocation.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Ensure LINE_LIFF is always at the top
    const sortedLocations = [
      locations.find(l => l.id === 'LINE_LIFF'),
      ...locations.filter(l => l.id !== 'LINE_LIFF')
    ].filter(Boolean);

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

    return NextResponse.json({ success: true, locations: sortedLocations, activeCampaigns });
  } catch (error) {
    console.error('QR Locations GET Error:', error);
    return NextResponse.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

// POST: 新增立牌位置
export async function POST(request: NextRequest) {
  try {
    if (!(await checkAdminAuth())) {
      return NextResponse.json({ success: false, message: '權限不足' }, { status: 403 });
    }

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
    if (!(await checkAdminAuth())) {
      return NextResponse.json({ success: false, message: '權限不足' }, { status: 403 });
    }

    const { id, activeCampaignId, name } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: '缺少立牌 ID' });
    }

    const dataToUpdate: any = {
      updatedAt: new Date(),
    };
    
    if (activeCampaignId !== undefined) {
      dataToUpdate.activeCampaignId = activeCampaignId || null;
    }
    
    if (name !== undefined) {
      dataToUpdate.name = name.trim();
    }

    const location = await prisma.qrLocation.update({
      where: { id },
      data: dataToUpdate
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
    if (!(await checkAdminAuth())) {
      return NextResponse.json({ success: false, message: '權限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: '缺少立牌 ID' });
    }

    if (id === 'LINE_LIFF') {
      return NextResponse.json({ success: false, message: '無法刪除系統預設項目' });
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
