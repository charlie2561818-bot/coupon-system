import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 取得所有使用者清單 (僅限 Admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '權限不足，拒絕存取' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

// 建立新使用者 (僅限 Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '權限不足，拒絕存取' }, { status: 403 });
    }

    const { username, password, name, role } = await request.json();

    if (!username || !password || !name || !role) {
      return NextResponse.json({ success: false, message: '缺少必要參數' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: '帳號已被使用' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      }
    });

    return NextResponse.json({ success: true, user: newUser, message: '建立帳號成功' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}
