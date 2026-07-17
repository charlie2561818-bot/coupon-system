import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, answer, newPassword } = await request.json();

    if (!username || !answer || !newPassword) {
      return NextResponse.json({ success: false, message: '缺少必要參數' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.securityAnswer) {
      return NextResponse.json({ success: false, message: '驗證失敗或尚未設定問答' }, { status: 400 });
    }

    // 驗證答案
    const isAnswerCorrect = await bcrypt.compare(answer, user.securityAnswer);
    if (!isAnswerCorrect) {
      return NextResponse.json({ success: false, message: '安全提示答案錯誤' }, { status: 400 });
    }

    // 驗證通過，重設密碼
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true, message: '密碼重設成功' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '伺服器發生錯誤' }, { status: 500 });
  }
}
