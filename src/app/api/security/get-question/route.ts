import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ success: false, message: '請提供帳號' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { securityQuestion: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: '找不到此帳號' }, { status: 404 });
    }

    if (!user.securityQuestion) {
      return NextResponse.json({ success: false, message: '此帳號尚未設定安全提示問答，無法進行還原' }, { status: 400 });
    }

    return NextResponse.json({ success: true, question: user.securityQuestion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '伺服器發生錯誤' }, { status: 500 });
  }
}
