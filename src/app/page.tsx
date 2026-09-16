'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from './lib/supabase';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays
} from 'date-fns';
import { ChevronLeft, ChevronRight, Send, X, Trash2 } from 'lucide-react';

interface Reservation {
  id?: string;
  date: string;
  status: string;
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // 날짜 설정 팝업 상태
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('예약마감');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const instagramId = process.env.NEXT_PUBLIC_INSTAGRAM_ID || 'your_instagram_id';
  const expectedAdminPw = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '0416';

  // 1. 관리자 진입 URL 체크 (?admin=seongjun 등)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isAdminQuery = searchParams.get('admin') === 'seongjun';
      const isSeongjunPath = path.includes('seongjun');

      if ((isAdminQuery || isSeongjunPath) && !isAdmin) {
        setShowAdminModal(true);
      }
    }
  }, [searchParams, isAdmin]);

  // 2. 예약 데이터 불러오기
  const fetchReservations = async () => {
    const { data, error } = await supabase.from('reservations').select('*');
    if (!error && data) {
      setReservations(data);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [currentMonth]);

  // 3. 관리자 로그인
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === expectedAdminPw) {
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPasswordInput('');
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  // 4. 날짜 클릭 시 모달 열기
  const handleDateClick = (dateStr: string) => {
    if (!isAdmin) return;

    setSelectedDate(dateStr);
    const existing = reservations.find((r) => r.date === dateStr);
    if (existing) {
      setStatusText(existing.status || '예약마감');
    } else {
      setStatusText('예약마감');
    }
    setShowEditModal(true);
  };

  // 5. 문구 저장
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || isSaving) return;

    const trimmedStatus = statusText.trim() || '예약마감';
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .upsert({ date: selectedDate, status: trimmedStatus }, { onConflict: 'date' })
        .select();

      if (error) {
        alert(`저장 중 오류가 발생했습니다: ${error.message}`);
      } else {
        setReservations((prev) => {
          const filtered = prev.filter((r) => r.date !== selectedDate);
          return [...filtered, { date: selectedDate, status: trimmedStatus }];
        });
        setShowEditModal(false);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 6. 삭제 (예약 가능으로 변경)
  const handleDeleteStatus = async () => {
    if (!selectedDate || isSaving) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('reservations').delete().eq('date', selectedDate);
      if (error) {
        alert(`삭제 중 오류: ${error.message}`);
      } else {
        setReservations((prev) => prev.filter((r) => r.date !== selectedDate));
        setShowEditModal(false);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 캘린더 날짜 계산
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let days = [];
  let day = startDate;

  const currentYear = currentMonth.getFullYear();
  const currentMonthNum = currentMonth.getMonth();

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dateKey = format(day, 'yyyy-MM-dd');
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isToday = isSameDay(day, new Date());
      const reservation = reservations.find((r) => r.date === dateKey);
      const targetDay = day;

      days.push(
        <div
          key={dateKey}
          onClick={() => handleDateClick(dateKey)}
          className={`min-h-[92px] md:min-h-[112px] p-2 border-b border-r border-zinc-800 flex flex-col justify-between transition-colors ${
            !isCurrentMonth ? 'text-zinc-600 bg-zinc-950/40' : 'text-zinc-200 bg-zinc-900/60'
          } ${isAdmin ? 'cursor-pointer hover:bg-zinc-800/80 active:scale-[0.98]' : ''}`}
        >
          {/* 일자 */}
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full ${
                isToday ? 'bg-sky-500 text-white font-bold' : ''
              }`}
            >
              {format(targetDay, 'd')}
            </span>
          </div>

          {/* 등록된 문구 뱃지 */}
          <div className="my-auto flex flex-col gap-1 items-center w-full px-0.5">
            {reservation && (
              <span className="w-full text-center py-1 px-1 text-[11px] md:text-xs font-semibold rounded bg-[#ff4d79] text-white shadow-md leading-tight break-all line-clamp-2">
                {reservation.status}
              </span>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={format(day, 'yyyy-MM-dd')}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="min-h-screen bg-[#121316] text-zinc-100 flex flex-col items-center p-3 md:p-6 pb-28 select-none">
      <style jsx global>{`
        nextjs-portal,
        [data-nextjs-dev-overlay] {
          display: none !important;
        }
      `}</style>

      {/* 상단 헤더 */}
      <header className="w-full max-w-xl flex items-center justify-between py-4 border-b border-zinc-800 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-white">예약현황</h1>
          {isAdmin && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-semibold">
              관리자 모드
            </span>
          )}
        </div>
      </header>

      {/* 캘린더 본체 */}
      <main className="w-full max-w-xl bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between p-3.5 md:p-4 border-b border-zinc-800 bg-zinc-950/40">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>

          {/* 나중에 인스타 생기면 아래 주석을 풀어서 사용
          <div className="text-center">
            <span className="inline-block bg-pink-500/20 text-pink-300 font-bold px-4 py-1.5 rounded-full text-base tracking-wide border border-pink-500/30">
              {format(currentMonth, 'M월 예약현황')}
            </span>
          </div>
          */}

          {/* 연도 & 월 선택 */}
          <div className="flex items-center gap-2">
            <select
              value={currentYear}
              onChange={(e) => {
                const newYear = parseInt(e.target.value);
                const nextDate = new Date(currentMonth);
                nextDate.setFullYear(newYear);
                setCurrentMonth(nextDate);
              }}
              className="bg-zinc-900 border border-zinc-700 text-pink-300 font-bold px-3 py-1.5 rounded-xl text-sm md:text-base focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y} className="bg-zinc-900 text-white">
                  {y}년
                </option>
              ))}
            </select>

            <select
              value={currentMonthNum}
              onChange={(e) => {
                const newMonth = parseInt(e.target.value);
                const nextDate = new Date(currentMonth);
                nextDate.setMonth(newMonth);
                setCurrentMonth(nextDate);
              }}
              className="bg-zinc-900 border border-zinc-700 text-pink-300 font-bold px-3 py-1.5 rounded-xl text-sm md:text-base focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i} className="bg-zinc-900 text-white">
                  {i + 1}월
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 요일 */}
        <div className="grid grid-cols-7 border-b border-zinc-800 text-center py-2 text-xs font-semibold text-zinc-400 bg-zinc-950/60">
          <span className="text-red-400">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span className="text-sky-400">토</span>
        </div>

        {/* 날짜 그리드 */}
        <div className="border-l border-t border-zinc-800">{rows}</div>
      </main>

      {/* 안내 문구 */}
      <div className="w-full max-w-xl mt-4 text-center text-xs text-zinc-400 leading-relaxed">
        {isAdmin ? (
          <p className="text-amber-400 font-medium">👉 날짜를 클릭하면 문구를 직접 작성하거나 [예약마감]으로 빠르게 설정할 수 있습니다.</p>
        ) : (
          <p>비어있는 날짜를 확인하신 후 아래 버튼으로 문의해 주세요!</p>
        )}
      </div>

      {/* DM 버튼 */}
      <div className="fixed bottom-4 inset-x-0 mx-auto w-full max-w-md px-4 z-40">
        <a
          href={`https://ig.me/m/${instagramId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white py-4 px-6 rounded-2xl font-bold text-base shadow-xl flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
        >
          <Send size={18} />
          인스타그램 DM 예약하기
        </a>
      </div>

      {/* 관리자 인증 모달 */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAdminLogin}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-xs shadow-2xl flex flex-col gap-4"
          >
            <h2 className="text-lg font-bold text-white text-center">관리자 인증</h2>
            <p className="text-xs text-zinc-400 text-center">비밀번호를 입력해 주세요.</p>
            <input
              type="password"
              placeholder="관리자 비밀번호"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition"
              >
                닫기
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold transition"
              >
                확인
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 날짜 설정 모달 (글 작성 + 빠른 '예약마감' 클릭 버튼) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveStatus}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-xs shadow-2xl flex flex-col gap-4 relative"
          >
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold text-white text-center">
              {selectedDate} 상태 설정
            </h2>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400 font-medium">직접 문구 작성</label>
              <input
                type="text"
                placeholder="표시할 문구 입력"
                value={statusText}
                maxLength={10}
                onChange={(e) => setStatusText(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500"
                autoFocus
              />
              
              {/* 빠른 선택: '예약마감' 단독 버튼 */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-zinc-500">빠른 선택:</span>
                <button
                  type="button"
                  onClick={() => setStatusText('예약마감')}
                  className="text-xs bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 font-semibold px-2.5 py-1 rounded-lg border border-pink-500/40 cursor-pointer active:scale-95 transition"
                >
                  ⚡ 예약마감
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleDeleteStatus}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-red-950/60 text-red-400 border border-zinc-700 hover:border-red-500/40 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                title="등록 해제 (예약 가능으로 변경)"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121316] text-white flex items-center justify-center">로딩 중...</div>}>
      <CalendarContent />
    </Suspense>
  );
}