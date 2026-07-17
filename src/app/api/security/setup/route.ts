import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: '未授權' }, { status: 401 });
    }

    const { question, answer } = await request.json();
    const username = (session.user as any).username;

    if (!username || !question || !answer) {
      return NextResponse.json({ success: false, message: '缺少必要參數' }, { status: 400 });
    }

    // 將答案進行 bcrypt 雜湊加密
    const hashedAnswer = await bcrypt.hash(answer, 10);

    await prisma.user.update({
      where: { username },
      data: {
        securityQuestion: question,
        securityAnswer: hashedAnswer,
      }
    });

    return NextResponse.json({ success: true, message: '安全提示問答設定成功' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '伺服器發生錯誤' }, { status: 500 });
  }
}
