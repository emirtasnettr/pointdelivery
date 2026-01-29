/**
 * Fırsat Detay Sayfası
 * 
 * Müşterilerin fırsat detaylarını görüntüleyip düzenleyebileceği sayfa
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type JobType = 'FULL_TIME' | 'PART_TIME' | 'SEASONAL' | null;

interface JobPosting {
  id: string;
  customer_id: string;
  title: string;
  task: string | null;
  description: string | null;
  required_count: number;
  city: string | null;
  district: string | null;
  job_type: JobType;
  contract_start_date: string | null;
  contract_end_date: string | null;
  part_time_start_date: string | null;
  part_time_end_date: string | null;
  seasonal_period_months: number | null;
  monthly_budget_per_person: number | null;
  daily_budget_per_person: number | null;
  hourly_budget_per_person: number | null;
  working_hours: Record<string, { start: string; end: string }> | null;
  start_date: string | null;
  status: 'ACTIVE' | 'CURRENT' | 'PAST' | 'REJECTED';
  rejection_reason: 'NEW_OFFER' | 'PERSONNEL_SHORTAGE' | null;
  new_offer_monthly_budget_per_person: number | null;
  new_offer_daily_budget_per_person: number | null;
  new_offer_total_without_vat: number | null;
  new_offer_total_with_vat: number | null;
  new_offer_accepted: boolean | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function JobPostingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [acceptedCandidates, setAcceptedCandidates] = useState<Array<{
    id: string;
    full_name: string;
    phone: string | null;
  }>>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Profil kontrolü
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileData || profileData.role !== 'CUSTOMER') {
          router.push('/');
          return;
        }

        setProfile(profileData);

        // İş ilanını al
        const { data: job, error: jobError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('id', jobId)
          .eq('customer_id', user.id)
          .single();

        if (jobError || !job) {
          setError('İş ilanı bulunamadı');
          setLoading(false);
          return;
        }

        setJobPosting(job);

        // Kabul eden adayları al
        const { data: assignments, error: assignmentsError } = await supabase
          .from('job_assignments')
          .select('candidate_id')
          .eq('job_posting_id', jobId)
          .eq('status', 'ACCEPTED')
          .order('responded_at', { ascending: false });

        if (assignmentsError) {
          console.error('Job assignments error:', assignmentsError);
        }

        if (assignments && assignments.length > 0) {
          const candidatesWithInfo = await Promise.all(
            assignments.map(async (assignment) => {
              try {
                const { data: candidateProfile, error: profileError } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', assignment.candidate_id)
                  .single();

                if (profileError) {
                  console.error('Profile error for candidate:', assignment.candidate_id, profileError);
                }

                const { data: candidateInfo, error: infoError } = await supabase
                  .from('candidate_info')
                  .select('phone')
                  .eq('profile_id', assignment.candidate_id)
                  .single();

                if (infoError) {
                  console.error('Candidate info error for candidate:', assignment.candidate_id, infoError);
                }

                return {
                  id: assignment.candidate_id,
                  full_name: candidateProfile?.full_name || 'İsimsiz Aday',
                  phone: candidateInfo?.phone || null,
                };
              } catch (err) {
                console.error('Error fetching candidate info:', err);
                return {
                  id: assignment.candidate_id,
                  full_name: 'Bilinmeyen',
                  phone: null,
                };
              }
            })
          );

          setAcceptedCandidates(candidatesWithInfo);
        } else {
          setAcceptedCandidates([]);
        }

        // Site logo'yu yükle
        try {
          const { data: settings } = await supabase
            .from('site_settings')
            .select('logo_url')
            .maybeSingle();
          
          if (settings?.logo_url) {
            setSiteLogo(settings.logo_url);
          }
        } catch (err) {
          console.log('Logo yüklenemedi:', err);
        }
      } catch (err: any) {
        setError(err.message || 'Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase, jobId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Aktif İşe Alım
          </span>
        );
      case 'CURRENT':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Aktif Sözleşme
          </span>
        );
      case 'PAST':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Geçmiş İşe Alım
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getJobTypeLabel = (jobType: JobType) => {
    switch (jobType) {
      case 'FULL_TIME':
        return 'Tam Zamanlı';
      case 'PART_TIME':
        return 'Part-time';
      case 'SEASONAL':
        return 'Dönemsel';
      default:
        return '-';
    }
  };

  const calculateMonthlyCost = (job: JobPosting) => {
    if (!job.monthly_budget_per_person || !job.required_count) return null;
    return job.monthly_budget_per_person * job.required_count;
  };

  const calculatePartTimeTotalHours = (job: JobPosting): number => {
    if (!job.working_hours || !job.part_time_start_date || !job.part_time_end_date) return 0;
    
    const startDate = new Date(job.part_time_start_date);
    const endDate = new Date(job.part_time_end_date);
    const days: string[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days.push(dateStr);
    }
    
    let totalMinutes = 0;
    days.forEach(day => {
      const hours = job.working_hours?.[day];
      if (hours?.start && hours?.end) {
        const [startH, startM] = hours.start.split(':').map(Number);
        const [endH, endM] = hours.end.split(':').map(Number);
        const startTotalMinutes = startH * 60 + startM;
        const endTotalMinutes = endH * 60 + endM;
        totalMinutes += endTotalMinutes - startTotalMinutes;
      }
    });
    
    return totalMinutes / 60; // Toplam saat
  };

  const calculatePartTimeTotalCost = (job: JobPosting) => {
    if (!job.hourly_budget_per_person || !job.required_count) return null;
    const totalHours = calculatePartTimeTotalHours(job);
    if (totalHours === 0) return null;
    return job.hourly_budget_per_person * job.required_count * totalHours;
  };

  const calculateTotalCost = (job: JobPosting) => {
    if (job.job_type === 'FULL_TIME') {
      const monthlyCost = calculateMonthlyCost(job);
      if (!monthlyCost) return null;
      return monthlyCost; // Aylık maliyet
    } else if (job.job_type === 'PART_TIME') {
      return calculatePartTimeTotalCost(job);
    } else if (job.job_type === 'SEASONAL') {
      const monthlyCost = calculateMonthlyCost(job);
      if (!monthlyCost || !job.seasonal_period_months) return null;
      return monthlyCost * job.seasonal_period_months;
    }
    return null;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !jobPosting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'İş ilanı bulunamadı'}</p>
          <Link
            href="/dashboard/customer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F9FE' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/customer" className="flex items-center">
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt="Site Logo"
                  className="h-10 w-auto max-w-[200px] object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">J</span>
                </div>
              )}
            </Link>
            <Link
              href="/dashboard/customer"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard'a Dön
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{jobPosting.title}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge(jobPosting.status)}
                  <span className="text-sm text-gray-600">
                  Oluşturulma: {formatDate(jobPosting.created_at)}
                </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fırsat Detayları */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sol Kolon - Ana Bilgiler */}
              <div className="lg:col-span-2 space-y-5">
            {/* Görev */}
            {jobPosting.task && (
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Görev</h3>
                    <p className="text-gray-900 text-base leading-relaxed">{jobPosting.task}</p>
              </div>
            )}

            {/* Açıklama */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Fırsat Açıklaması</h3>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {jobPosting.description || 'Açıklama girilmemiş'}
                </p>
            </div>

            {/* Temel Bilgiler */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Temel Bilgiler</h3>
                  <div className="grid grid-cols-2 gap-4">
            <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">İş Tipi</label>
                  <p className="text-base font-semibold text-gray-900">{getJobTypeLabel(jobPosting.job_type)}</p>
                </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Kişi Sayısı</label>
                  <p className="text-base font-semibold text-gray-900">{jobPosting.required_count} kişi</p>
                </div>
                    {jobPosting.city && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">İl</label>
                        <p className="text-base font-semibold text-gray-900">{jobPosting.city}</p>
                      </div>
                    )}
                    {jobPosting.district && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">İlçe</label>
                        <p className="text-base font-semibold text-gray-900">{jobPosting.district}</p>
                </div>
                    )}
              </div>
            </div>

            {/* İş Tipine Göre Tarih Bilgileri */}
            {jobPosting.job_type === 'FULL_TIME' && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Sözleşme Bilgileri</h3>
                    <div className="grid grid-cols-2 gap-4">
              <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Başlangıç Tarihi</label>
                    <p className="text-base font-semibold text-gray-900">{formatDate(jobPosting.contract_start_date)}</p>
                  </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Bitiş Tarihi</label>
                    <p className="text-base font-semibold text-gray-900">{formatDate(jobPosting.contract_end_date)}</p>
                  </div>
                </div>
              </div>
            )}

            {jobPosting.job_type === 'PART_TIME' && (
                  <>
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Gün Aralığı Bilgileri
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
              <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Başlangıç Tarihi</label>
                    <p className="text-base font-semibold text-gray-900">{formatDate(jobPosting.part_time_start_date)}</p>
                  </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Bitiş Tarihi</label>
                    <p className="text-base font-semibold text-gray-900">{formatDate(jobPosting.part_time_end_date)}</p>
                  </div>
                </div>
              </div>

                    {/* Çalışma Saatleri */}
                    {jobPosting.working_hours && jobPosting.part_time_start_date && jobPosting.part_time_end_date && (() => {
                      const startDate = new Date(jobPosting.part_time_start_date);
                      const endDate = new Date(jobPosting.part_time_end_date);
                      const days: string[] = [];
                      
                      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        days.push(dateStr);
                      }

                      const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                      
                      return (
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5">
                          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Çalışma Saatleri
                          </h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {days.map((day) => {
                              const date = new Date(day);
                              const dayName = dayNames[date.getDay()];
                              const dayFormatted = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                              const hours = jobPosting.working_hours?.[day];
                              
                              if (!hours || !hours.start || !hours.end) return null;

                              const [startH, startM] = hours.start.split(':').map(Number);
                              const [endH, endM] = hours.end.split(':').map(Number);
                              const startTotalMinutes = startH * 60 + startM;
                              const endTotalMinutes = endH * 60 + endM;
                              const diffMinutes = endTotalMinutes - startTotalMinutes;
                              const diffHours = Math.floor(diffMinutes / 60);
                              const diffMins = diffMinutes % 60;

                              return (
                                <div key={day} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-900">{dayFormatted}</p>
                                          <p className="text-xs text-gray-500">{dayName}</p>
                                        </div>
                                      </div>
                                      <div className="ml-10 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span className="text-xs text-gray-600">Başlangıç:</span>
                                          <span className="text-sm font-semibold text-gray-900">{hours.start}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span className="text-xs text-gray-600">Bitiş:</span>
                                          <span className="text-sm font-semibold text-gray-900">{hours.end}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="ml-4 text-right">
                                      <div className="bg-blue-100 rounded-lg px-3 py-2">
                                        <p className="text-xs text-gray-600 mb-1">Toplam Süre</p>
                                        <p className="text-sm font-bold text-blue-700">
                                          {diffHours} saat {diffMins > 0 ? `${diffMins} dk` : ''}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </>
            )}

            {jobPosting.job_type === 'SEASONAL' && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Dönemsel Bilgiler</h3>
              <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Dönemsel Süre</label>
                  <p className="text-base font-semibold text-gray-900">{jobPosting.seasonal_period_months} ay</p>
                </div>
              </div>
            )}

                {/* Kabul Eden Adaylar */}
                {acceptedCandidates.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Kabul Eden Adaylar ({acceptedCandidates.length})
                    </h3>
                    <div className="space-y-3">
                      {acceptedCandidates.map((candidate) => (
                        <div key={candidate.id} className="bg-white rounded-lg p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-base font-semibold text-gray-900">{candidate.full_name}</p>
                                  {candidate.phone ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                      <span className="font-medium">{candidate.phone}</span>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400 mt-1">Telefon bilgisi bulunamadı</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Kabul Edildi
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Sağ Kolon - Özet Bilgiler */}
              <div className="lg:col-span-1 space-y-5">
            {/* Maliyet Bilgileri */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 sticky top-24">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Maliyet Özeti
                  </h3>
                  <div className="space-y-3">
                  {jobPosting.job_type === 'FULL_TIME' && (() => {
                    const monthlyCost = calculateMonthlyCost(jobPosting) || 0;
                      const serviceFee = monthlyCost * 0.12;
                      const baseForVAT = monthlyCost + serviceFee;
                      const vatAmount = baseForVAT * 0.20;
                      const totalWithVAT = monthlyCost + serviceFee + vatAmount;
                    return (
                      <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Aylık Kişi Başı:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(jobPosting.monthly_budget_per_person)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">KDV Hariç:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(monthlyCost)}</span>
                        </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Hizmet (%12):</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(serviceFee)}</span>
                        </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">KDV (%20):</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(vatAmount)}</span>
                        </div>
                          <div className="flex justify-between items-center pt-3 border-t border-blue-300 mt-3">
                            <span className="font-semibold text-gray-900">Toplam:</span>
                          <span className="text-lg font-bold text-blue-600">{formatCurrency(totalWithVAT)}</span>
                        </div>
                      </>
                    );
                  })()}

                    {jobPosting.job_type === 'PART_TIME' && (() => {
                      const totalCostWithoutVAT = calculateTotalCost(jobPosting) || 0;
                      const serviceFee = totalCostWithoutVAT * 0.12;
                      const baseForVAT = totalCostWithoutVAT + serviceFee;
                      const vatAmount = baseForVAT * 0.20;
                      const totalCostWithVAT = totalCostWithoutVAT + serviceFee + vatAmount;
                      
                      return (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Saatlik Kişi Başı:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(jobPosting.hourly_budget_per_person)}</span>
                      </div>
                      {jobPosting.part_time_start_date && jobPosting.part_time_end_date && (
                        <>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Toplam Gün:</span>
                                <span className="font-semibold text-gray-900">
                              {(() => {
                                const startDate = new Date(jobPosting.part_time_start_date);
                                const endDate = new Date(jobPosting.part_time_end_date);
                                const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                return `${daysDiff} gün`;
                              })()}
                            </span>
                          </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Toplam Saat:</span>
                                <span className="font-semibold text-gray-900">
                                  {calculatePartTimeTotalHours(jobPosting).toFixed(1)} saat
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">KDV Hariç:</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(totalCostWithoutVAT)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Hizmet (%12):</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(serviceFee)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">KDV (%20):</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(vatAmount)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-blue-300 mt-3">
                                <span className="font-semibold text-gray-900">Toplam:</span>
                                <span className="text-lg font-bold text-blue-600">{formatCurrency(totalCostWithVAT)}</span>
                          </div>
                        </>
                      )}
                    </>
                      );
                    })()}

                    {jobPosting.job_type === 'SEASONAL' && (() => {
                      const totalCostWithoutVAT = calculateTotalCost(jobPosting) || 0;
                      const serviceFee = totalCostWithoutVAT * 0.12;
                      const baseForVAT = totalCostWithoutVAT + serviceFee;
                      const vatAmount = baseForVAT * 0.20;
                      const totalCostWithVAT = totalCostWithoutVAT + serviceFee + vatAmount;
                      
                      return (
                    <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Aylık Kişi Başı:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(jobPosting.monthly_budget_per_person)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Dönemsel Süre:</span>
                            <span className="font-semibold text-gray-900">{jobPosting.seasonal_period_months} ay</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">KDV Hariç:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(totalCostWithoutVAT)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Hizmet (%12):</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(serviceFee)}</span>
                      </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">KDV (%20):</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(vatAmount)}</span>
                      </div>
                          <div className="flex justify-between items-center pt-3 border-t border-blue-300 mt-3">
                            <span className="font-semibold text-gray-900">Toplam:</span>
                            <span className="text-lg font-bold text-blue-600">{formatCurrency(totalCostWithVAT)}</span>
                      </div>
                    </>
                      );
                    })()}
              </div>
            </div>

            {/* Action Buttons */}
                <div className="pt-5">
              <Link
                href="/dashboard/customer"
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-center block"
              >
                Geri Dön
              </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
