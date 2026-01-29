/**
 * Fırsat Oluşturma Sayfası
 * 
 * Müşterilerin yeni fırsat oluşturabileceği sayfa
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { JobPosting } from '@/types/database';

type JobType = 'FULL_TIME' | 'PART_TIME' | 'SEASONAL' | '';

// Türkiye İlleri ve İlçeleri
const turkishCities = {
  'İstanbul': ['Kadıköy', 'Beşiktaş', 'Şişli', 'Beyoğlu', 'Üsküdar', 'Kartal', 'Pendik', 'Bakırköy', 'Fatih', 'Maltepe', 'Ataşehir', 'Beylikdüzü', 'Büyükçekmece'],
  'Ankara': ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Sincan', 'Etimesgut', 'Pursaklar', 'Altındağ', 'Gölbaşı', 'Polatlı'],
  'İzmir': ['Konak', 'Bornova', 'Karşıyaka', 'Buca', 'Çiğli', 'Gaziemir', 'Bayraklı', 'Balçova', 'Narlıdere', 'Torbalı'],
  'Bursa': ['Nilüfer', 'Osmangazi', 'Yıldırım', 'Mudanya', 'Gemlik', 'İnegöl', 'Mustafakemalpaşa', 'Karacabey'],
  'Antalya': ['Muratpaşa', 'Kepez', 'Konyaaltı', 'Alanya', 'Manavgat', 'Kaş', 'Kemer', 'Serik'],
  'Adana': ['Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Kozan'],
  'Gaziantep': ['Şahinbey', 'Şehitkamil', 'İslahiye', 'Nizip', 'Karkamış'],
  'Kocaeli': ['İzmit', 'Gebze', 'Darıca', 'Körfez', 'Gölcük', 'Derince'],
  'Konya': ['Selçuklu', 'Meram', 'Karatay', 'Akören', 'Akşehir', 'Beyşehir'],
  'Mersin': ['Yenişehir', 'Toroslar', 'Akdeniz', 'Mezitli', 'Erdemli', 'Silifke'],
  'Diyarbakır': ['Bağlar', 'Kayapınar', 'Sur', 'Yenişehir', 'Bismil'],
  'Hatay': ['Antakya', 'İskenderun', 'Defne', 'Samandağ', 'Reyhanlı'],
  'Manisa': ['Yunusemre', 'Şehzadeler', 'Akhisar', 'Salihli', 'Turgutlu'],
  'Kayseri': ['Melikgazi', 'Kocasinan', 'Talas', 'İncesu', 'Develi'],
  'Samsun': ['İlkadım', 'Canik', 'Atakum', 'Bafra', 'Çarşamba'],
  'Balıkesir': ['Altıeylül', 'Karesi', 'Bandırma', 'Edremit', 'Gönen'],
  'Kahramanmaraş': ['Dulkadiroğlu', 'Onikişubat', 'Elbistan', 'Afşin'],
  'Van': ['İpekyolu', 'Tuşba', 'Edremit', 'Erciş'],
  'Aydın': ['Efeler', 'Nazilli', 'Kuşadası', 'Söke', 'Didim'],
  'Tekirdağ': ['Süleymanpaşa', 'Çerkezköy', 'Çorlu', 'Ergene'],
};

const allCities = Object.keys(turkishCities).sort();

export default function CreateJobPostingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [showTimeLimitModal, setShowTimeLimitModal] = useState(false);
  const [timeLimitMessage, setTimeLimitMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '', // Fırsat Başlığı
    task: '', // Görev
    description: '', // Fırsat Açıklaması (ne aranıyor)
    required_count: 1, // Kaç kişiye ihtiyaç var
    city: '', // İl
    district: '', // İlçe
    job_type: '' as JobType, // İş Tipi (FULL_TIME, PART_TIME, SEASONAL)
    // Tam Zamanlı için
    contract_start_date: '', // Sözleşme Başlangıç Tarihi
    contract_end_date: '', // Sözleşme Bitiş Tarihi
    monthly_budget_per_person: '', // Aylık kişi başı bütçe
    // Part-time için
    part_time_start_date: '', // Part-time başlangıç tarihi
    part_time_end_date: '', // Part-time bitiş tarihi
    hourly_budget_per_person: '', // Saatlik kişi başı bütçe
    // Dönemsel için
    seasonal_period_months: 1, // Dönemsel süre (1, 3, 6, 12 ay)
    seasonal_monthly_budget_per_person: '', // Aylık kişi başı bütçe
  });

  // Çalışma saatleri - her gün için {start: "09:00", end: "17:00"} formatında
  const [workingHours, setWorkingHours] = useState<Record<string, { start: string; end: string }>>({});
  const [selectedTimePicker, setSelectedTimePicker] = useState<{ day: string; field: 'start' | 'end' } | null>(null);
  const timePickerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Dışarı tıklandığında saat seçicisini kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectedTimePicker) {
        const refKey = `${selectedTimePicker.day}-${selectedTimePicker.field}`;
        const ref = timePickerRefs.current[refKey];
        if (ref && !ref.contains(event.target as Node)) {
          setSelectedTimePicker(null);
        }
      }
    }

    if (selectedTimePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedTimePicker]);

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

        // Müşteri bilgilerini kontrol et
        const { data: customerInfoData } = await supabase
          .from('customer_info')
          .select('*')
          .eq('profile_id', user.id)
          .single();

        if (!customerInfoData) {
          // Müşteri bilgileri yoksa profil tamamlama sayfasına yönlendir
          router.push('/dashboard/customer/profile/complete');
          return;
        }

        setCustomerInfo(customerInfoData);

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
  }, [router, supabase]);

  // Tarihler arasındaki günleri hesapla
  const getDaysBetweenDates = (startDate: string, endDate: string): string[] => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: string[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      days.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Toplam maliyet hesaplama (KDV Hariç)
  const totalCostWithoutVAT = useMemo(() => {
    if (!formData.required_count || formData.required_count < 1) return 0;

    const personCount = formData.required_count;

    if (formData.job_type === 'PART_TIME') {
      // Part-Time: Saatlik kişi başı bütçe * Kişi sayısı * Her gün için çalışılan saat toplamı
      const hourlyBudget = parseFloat(formData.hourly_budget_per_person || '0');
      if (!hourlyBudget || !formData.part_time_start_date || !formData.part_time_end_date) return 0;

      const days = getDaysBetweenDates(formData.part_time_start_date, formData.part_time_end_date);
      let totalHours = 0;

      days.forEach(day => {
        const hours = workingHours[day];
        if (hours && hours.start && hours.end) {
          const [startHours, startMinutes] = hours.start.split(':').map(Number);
          const [endHours, endMinutes] = hours.end.split(':').map(Number);
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = endHours * 60 + endMinutes;
          const diffMinutes = endTotalMinutes - startTotalMinutes;
          const diffHours = diffMinutes / 60;
          totalHours += diffHours;
        }
      });

      return hourlyBudget * personCount * totalHours;
    } else if (formData.job_type === 'SEASONAL') {
      // Dönemsel: Aylık kişi başı bütçe * Kişi sayısı * Ay sayısı
      const monthlyBudget = parseFloat(formData.seasonal_monthly_budget_per_person || '0');
      if (!monthlyBudget || !formData.seasonal_period_months) return 0;

      return monthlyBudget * personCount * formData.seasonal_period_months;
    }

    return 0;
  }, [formData, workingHours]);

  // Hizmet bedeli hesaplama (%12 - KDV hariç toplam üzerinden)
  const serviceFee = useMemo(() => {
    return totalCostWithoutVAT * 0.12;
  }, [totalCostWithoutVAT]);

  // KDV hesaplama (%20 - KDV hariç toplam + hizmet bedeli üzerinden)
  const vatAmount = useMemo(() => {
    const baseForVAT = totalCostWithoutVAT + serviceFee;
    return baseForVAT * 0.20;
  }, [totalCostWithoutVAT, serviceFee]);

  // KDV Dahil Toplam
  const totalCostWithVAT = useMemo(() => {
    return totalCostWithoutVAT + serviceFee + vatAmount;
  }, [totalCostWithoutVAT, serviceFee, vatAmount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Tam saat seçenekleri oluştur (sadece :00)
  const generateTimeOptions = (): string[] => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Tarih değiştiğinde çalışma saatlerini güncelle
  useEffect(() => {
    if (formData.job_type === 'PART_TIME' && formData.part_time_start_date && formData.part_time_end_date) {
      const days = getDaysBetweenDates(formData.part_time_start_date, formData.part_time_end_date);
      setWorkingHours(prev => {
        const newWorkingHours: Record<string, { start: string; end: string }> = {};
        
        days.forEach(day => {
          // Eğer bu gün için saat belirlenmemişse, varsayılan değerleri kullan
          if (!prev[day]) {
            newWorkingHours[day] = { start: '09:00', end: '17:00' };
          } else {
            // Mevcut saatleri tam saate yuvarla (sadece :00)
            const start = prev[day].start || '09:00';
            const end = prev[day].end || '17:00';
            const [startHour] = start.split(':').map(Number);
            const [endHour] = end.split(':').map(Number);
            newWorkingHours[day] = {
              start: `${startHour.toString().padStart(2, '0')}:00`,
              end: `${endHour.toString().padStart(2, '0')}:00`,
            };
          }
        });
        
        return newWorkingHours;
      });
    } else if (formData.job_type !== 'PART_TIME') {
      // Part-time değilse çalışma saatlerini temizle
      setWorkingHours({});
      setSelectedTimePicker(null);
    }
  }, [formData.part_time_start_date, formData.part_time_end_date, formData.job_type]);

  // Dışarı tıklayınca saat seçicisini kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.time-picker-container')) {
        setSelectedTimePicker(null);
      }
    };

    if (selectedTimePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedTimePicker]);

  // Saat aralığı kontrolü (maksimum 12 saat)
  const validateTimeRange = (start: string, end: string): { isValid: boolean; error?: string } => {
    if (!start || !end) return { isValid: true }; // Boşsa validasyon yapma
    
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    // Bitiş saati başlangıç saatinden önce olamaz
    if (endTotalMinutes < startTotalMinutes) {
      return { isValid: false, error: 'Bitiş saati başlangıç saatinden önce olamaz' };
    }
    
    // Maksimum 12 saat kontrolü
    const diffMinutes = endTotalMinutes - startTotalMinutes;
    const diffHours = diffMinutes / 60;
    
    if (diffHours > 12) {
      return { isValid: false, error: 'Çalışma saati maksimum 12 saat olabilir' };
    }
    
    return { isValid: true };
  };

  // Çalışma saatlerini güncelle
  const updateWorkingHours = (date: string, field: 'start' | 'end', value: string) => {
    const currentHours = workingHours[date] || { start: '09:00', end: '17:00' };
    const newHours = {
      ...currentHours,
      [field]: value,
    };
    
    // Validasyon kontrolü
    const validation = validateTimeRange(newHours.start, newHours.end);
    
    if (!validation.isValid) {
      // Eğer bitiş saati güncelleniyorsa ve 12 saatten fazlaysa
      if (field === 'end' && validation.error?.includes('maksimum')) {
        // Modal uyarı göster
        setTimeLimitMessage('En fazla 12 saat seçilebilmektedir.');
        setShowTimeLimitModal(true);
        
        // Başlangıç saatinden 12 saat sonrasını ayarla
        const [startHours, startMinutes] = newHours.start.split(':').map(Number);
        const startTotalMinutes = startHours * 60 + startMinutes;
        const maxEndMinutes = startTotalMinutes + (12 * 60);
        const maxEndHours = Math.floor(maxEndMinutes / 60);
        const maxEndTime = `${maxEndHours.toString().padStart(2, '0')}:00`;
        
        // Kullanıcıya uyarı göster (3 saniye sonra temizle)
        setError(`Çalışma saati maksimum 12 saat olabilir. Bitiş saati ${maxEndTime} olarak ayarlandı.`);
        setTimeout(() => setError(null), 3000);
        
        newHours.end = maxEndTime;
      }
      // Eğer başlangıç saati güncelleniyorsa ve 12 saatten fazlaysa
      else if (field === 'start' && validation.error?.includes('maksimum')) {
        // Modal uyarı göster
        setTimeLimitMessage('En fazla 12 saat seçilebilmektedir.');
        setShowTimeLimitModal(true);
        
        // Bitiş saatinden 12 saat öncesini ayarla
        const [endHours, endMinutes] = newHours.end.split(':').map(Number);
        const endTotalMinutes = endHours * 60 + endMinutes;
        const minStartMinutes = endTotalMinutes - (12 * 60);
        const minStartHours = Math.floor(minStartMinutes / 60);
        const minStartTime = `${minStartHours.toString().padStart(2, '0')}:00`;
        
        // Kullanıcıya uyarı göster (3 saniye sonra temizle)
        setError(`Çalışma saati maksimum 12 saat olabilir. Başlangıç saati ${minStartTime} olarak ayarlandı.`);
        setTimeout(() => setError(null), 3000);
        
        newHours.start = minStartTime;
      }
      // Bitiş saati başlangıç saatinden önceyse
      else if (validation.error?.includes('önce')) {
        // Başlangıç saatinden 1 saat sonrasını ayarla
        const [startHours, startMinutes] = newHours.start.split(':').map(Number);
        const startTotalMinutes = startHours * 60 + startMinutes;
        const minEndMinutes = startTotalMinutes + 60; // En az 1 saat
        const minEndHours = Math.floor(minEndMinutes / 60);
        const minEndMins = minEndMinutes % 60;
        const minEndTime = `${minEndHours.toString().padStart(2, '0')}:${minEndMins.toString().padStart(2, '0')}`;
        
        setError('Bitiş saati başlangıç saatinden önce olamaz.');
        setTimeout(() => setError(null), 3000);
        
        newHours.end = minEndTime;
      }
    }
    
    setWorkingHours(prev => ({
      ...prev,
      [date]: newHours,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Giriş yapmamışsınız');
      }

      // Validasyon
      if (!formData.title || !formData.task || !formData.description || !formData.required_count || !formData.city || !formData.district || !formData.job_type) {
        throw new Error('Lütfen zorunlu alanları doldurun (Başlık, Görev, Açıklama, Kişi Sayısı, İl, İlçe, İş Tipi)');
      }

      if (formData.required_count < 1) {
        throw new Error('Kişi sayısı en az 1 olmalıdır');
      }

      // İş tipine göre validasyon
      if (formData.job_type === 'PART_TIME') {
        if (!formData.part_time_start_date || !formData.part_time_end_date) {
          throw new Error('Part-time işler için gün aralığı gereklidir');
        }
        if (!formData.hourly_budget_per_person || parseFloat(formData.hourly_budget_per_person) <= 0) {
          throw new Error('Part-time işler için saatlik kişi başı bütçe gereklidir');
        }
        const partTimeStartDate = new Date(formData.part_time_start_date);
        const partTimeEndDate = new Date(formData.part_time_end_date);
        if (partTimeEndDate < partTimeStartDate) {
          throw new Error('Part-time bitiş tarihi, başlangıç tarihinden sonra olmalıdır');
        }
        // Çalışma saatleri kontrolü
        const days = getDaysBetweenDates(formData.part_time_start_date, formData.part_time_end_date);
        const missingHours = days.filter(day => !workingHours[day] || !workingHours[day].start || !workingHours[day].end);
        if (missingHours.length > 0) {
          throw new Error('Lütfen tüm günler için çalışma saatlerini belirleyin');
        }
        // Saat aralığı kontrolü (maksimum 12 saat)
        const invalidHours = days.filter(day => {
          const hours = workingHours[day];
          if (!hours || !hours.start || !hours.end) return false;
          return !validateTimeRange(hours.start, hours.end).isValid;
        });
        if (invalidHours.length > 0) {
          throw new Error('Çalışma saati maksimum 12 saat olabilir ve bitiş saati başlangıç saatinden önce olamaz. Lütfen saat aralıklarını kontrol edin');
        }
      } else if (formData.job_type === 'SEASONAL') {
        if (!formData.seasonal_monthly_budget_per_person || parseFloat(formData.seasonal_monthly_budget_per_person) <= 0) {
          throw new Error('Dönemsel işler için aylık kişi başı bütçe gereklidir');
        }
      }

      // İş ilanı oluştur
      // Insert type: Omit<JobPosting, 'id' | 'created_at' | 'updated_at'> & { id?: string }
      type JobPostingInsert = Omit<JobPosting, 'id' | 'created_at' | 'updated_at'> & { id?: string };
      
      const insertData: JobPostingInsert = {
        customer_id: user.id,
        title: formData.title,
        task: formData.task || null,
        description: formData.description || null,
        required_count: formData.required_count,
        city: formData.city || null,
        district: formData.district || null,
        job_type: formData.job_type || null,
        contract_start_date: null,
        contract_end_date: null,
        part_time_start_date: null,
        part_time_end_date: null,
        seasonal_period_months: null,
        monthly_budget_per_person: null,
        daily_budget_per_person: null,
        hourly_budget_per_person: null,
        working_hours: null,
        start_date: null,
        status: 'ACTIVE',
        rejection_reason: null,
        rejected_by: null,
        rejected_at: null,
        new_offer_monthly_budget_per_person: null,
        new_offer_daily_budget_per_person: null,
        new_offer_total_without_vat: null,
        new_offer_total_with_vat: null,
        new_offer_accepted: null,
      };

      // İş tipine göre tarih ve bütçe alanlarını ekle
      if (formData.job_type === 'PART_TIME') {
        insertData.part_time_start_date = formData.part_time_start_date || null;
        insertData.part_time_end_date = formData.part_time_end_date || null;
        insertData.hourly_budget_per_person = formData.hourly_budget_per_person ? parseFloat(formData.hourly_budget_per_person) : null;
        insertData.working_hours = workingHours;
      } else if (formData.job_type === 'SEASONAL') {
        insertData.seasonal_period_months = formData.seasonal_period_months || null;
        insertData.monthly_budget_per_person = formData.seasonal_monthly_budget_per_person ? parseFloat(formData.seasonal_monthly_budget_per_person) : null;
      } else if (formData.job_type === 'FULL_TIME') {
        // Tam zamanlı işler için contract tarihleri kullanılabilir (eğer varsa)
        insertData.contract_start_date = null;
        insertData.contract_end_date = null;
        insertData.monthly_budget_per_person = null;
      }

      const { error: insertError } = await supabase
        .from('job_postings')
        .insert(insertData);

      if (insertError) {
        throw new Error(insertError.message || 'İş ilanı oluşturulurken hata oluştu');
      }

      // Başarılı - Dashboard'a yönlendir
      router.push('/dashboard/customer');
    } catch (err: any) {
      setError(err.message || 'İş ilanı oluşturulurken hata oluştu');
    } finally {
      setSubmitting(false);
    }
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
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Yeni Fırsat Oluştur</h1>
            <p className="text-sm text-gray-600">
              İhtiyacınız olan personel için fırsat oluşturun
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* İlk Satır - Başlık ve Görev */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fırsat Başlığı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Muhasebe Elemanı, Satış Temsilcisi"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Görev <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.task}
                  onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={submitting}
                >
                  <option value="">Görev seçiniz</option>
                  <option value="Garson">Garson</option>
                  <option value="Kurye">Kurye</option>
                  <option value="Kasiyer">Kasiyer</option>
                  <option value="Hostes">Hostes</option>
                  <option value="Host">Host</option>
                  <option value="Sekreter">Sekreter</option>
                </select>
              </div>
            </div>

            {/* Fırsat Açıklaması */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="İş ilanı detaylarını buraya yazın... (Ne aranıyor, görevler, sorumluluklar vb.)"
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                disabled={submitting}
              />
            </div>

            {/* İkinci Satır - Kişi Sayısı, İl, İlçe, İş Tipi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kişi Sayısı <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.required_count}
                  onChange={(e) => setFormData({ ...formData, required_count: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İl <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value, district: '' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={submitting}
                >
                  <option value="">İl seçiniz</option>
                  {allCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İlçe <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  required
                  disabled={!formData.city || submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="">İlçe seçiniz</option>
                  {formData.city && turkishCities[formData.city as keyof typeof turkishCities]?.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İş Tipi <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.job_type}
                  onChange={(e) => setFormData({ ...formData, job_type: e.target.value as JobType })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={submitting}
                >
                  <option value="">İş tipi seçiniz</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="SEASONAL">Dönemsel</option>
                </select>
              </div>
            </div>

            {/* Part-time için Tarih ve Bütçe */}
            {formData.job_type === 'PART_TIME' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlangıç Tarihi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.part_time_start_date}
                      onChange={(e) => setFormData({ ...formData, part_time_start_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bitiş Tarihi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.part_time_end_date}
                      onChange={(e) => setFormData({ ...formData, part_time_end_date: e.target.value })}
                      min={formData.part_time_start_date || new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Saatlik Kişi Başı Bütçe (₺) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourly_budget_per_person}
                      onChange={(e) => setFormData({ ...formData, hourly_budget_per_person: e.target.value })}
                      placeholder="Örn: 50"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Çalışma Saatleri */}
                {formData.part_time_start_date && formData.part_time_end_date && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Çalışma Saatleri <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-1">
                      {getDaysBetweenDates(formData.part_time_start_date, formData.part_time_end_date).map((day) => {
                        const date = new Date(day);
                        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
                        const dayFormatted = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                        const hours = workingHours[day] || { start: '09:00', end: '17:00' };
                        const validation = validateTimeRange(hours.start, hours.end);
                        const isValid = validation.isValid;
                        
                        // Saat farkını hesapla
                        const [startHours, startMinutes] = hours.start.split(':').map(Number);
                        const [endHours, endMinutes] = hours.end.split(':').map(Number);
                        const startTotalMinutes = startHours * 60 + startMinutes;
                        const endTotalMinutes = endHours * 60 + endMinutes;
                        const diffMinutes = endTotalMinutes - startTotalMinutes;
                        const diffHours = Math.floor(diffMinutes / 60);
                        const diffMins = diffMinutes % 60;
                        
                        const isTimePickerOpen = selectedTimePicker?.day === day;
                        
                        return (
                          <div key={day} className={`bg-white rounded-xl p-4 border-2 shadow-sm transition-all ${isValid ? 'border-gray-200 hover:border-gray-300' : 'border-red-300'} ${isTimePickerOpen ? 'border-blue-400 shadow-md' : ''}`}>
                            <div className="font-semibold text-gray-900 mb-3 text-sm">
                              {dayFormatted} ({dayName})
                            </div>
                            
                            {/* Başlangıç Saati */}
                            <div className="time-picker-container relative mb-3" ref={(el) => { timePickerRefs.current[`${day}-start`] = el; }}>
                              <label className="block text-xs text-gray-600 mb-1.5 font-medium">Başlangıç Saati</label>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const currentScroll = window.scrollY;
                                  setSelectedTimePicker(selectedTimePicker?.day === day && selectedTimePicker?.field === 'start' ? null : { day, field: 'start' });
                                  // Scroll pozisyonunu koru
                                  setTimeout(() => {
                                    window.scrollTo(0, currentScroll);
                                  }, 0);
                                }}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                                  isValid ? 'border-gray-300 bg-white hover:border-blue-500' : 'border-red-300 bg-red-50'
                                } ${selectedTimePicker?.day === day && selectedTimePicker?.field === 'start' ? 'border-blue-500 bg-blue-50' : ''}`}
                                disabled={submitting}
                              >
                                {hours.start}
                              </button>
                              {selectedTimePicker?.day === day && selectedTimePicker?.field === 'start' && (
                                <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                  <div className="grid grid-cols-5 gap-2">
                                    {timeOptions.map((time) => (
                                      <button
                                        key={time}
                                        type="button"
                                        onClick={() => {
                                          updateWorkingHours(day, 'start', time);
                                          setSelectedTimePicker(null);
                                        }}
                                        className={`px-3 py-2 text-[10px] font-medium rounded-lg transition-colors text-center ${
                                          hours.start === time
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                      >
                                        {time}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Bitiş Saati */}
                            <div className="time-picker-container relative mb-3" ref={(el) => { timePickerRefs.current[`${day}-end`] = el; }}>
                              <label className="block text-xs text-gray-600 mb-1.5 font-medium">Bitiş Saati</label>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const currentScroll = window.scrollY;
                                  setSelectedTimePicker(selectedTimePicker?.day === day && selectedTimePicker?.field === 'end' ? null : { day, field: 'end' });
                                  // Scroll pozisyonunu koru
                                  setTimeout(() => {
                                    window.scrollTo(0, currentScroll);
                                  }, 0);
                                }}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                                  isValid ? 'border-gray-300 bg-white hover:border-blue-500' : 'border-red-300 bg-red-50'
                                } ${selectedTimePicker?.day === day && selectedTimePicker?.field === 'end' ? 'border-blue-500 bg-blue-50' : ''}`}
                                disabled={submitting}
                              >
                                {hours.end}
                              </button>
                              {selectedTimePicker?.day === day && selectedTimePicker?.field === 'end' && (
                                <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                  <div className="grid grid-cols-5 gap-2">
                                    {timeOptions.map((time) => (
                                      <button
                                        key={time}
                                        type="button"
                                        onClick={() => {
                                          updateWorkingHours(day, 'end', time);
                                          setSelectedTimePicker(null);
                                        }}
                                        className={`px-3 py-2 text-[10px] font-medium rounded-lg transition-colors text-center ${
                                          hours.end === time
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                      >
                                        {time}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Toplam Süre */}
                            <div className="pt-3 border-t border-gray-200">
                              <div className="text-xs">
                                <span className="text-gray-500">Toplam süre: </span>
                                <span className={isValid ? 'text-gray-700 font-semibold' : 'text-red-600 font-semibold'}>
                                  {diffHours} saat {diffMins > 0 ? `${diffMins} dakika` : ''}
                                </span>
                                {!isValid && (
                                  <span className="text-red-600 font-medium block mt-1">
                                    (Maksimum 12 saat olmalıdır)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Dönemsel için Süre ve Bütçe */}
            {formData.job_type === 'SEASONAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dönemsel Süre <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.seasonal_period_months}
                    onChange={(e) => setFormData({ ...formData, seasonal_period_months: parseInt(e.target.value) })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={submitting}
                  >
                    <option value={1}>1 Ay</option>
                    <option value={3}>3 Ay</option>
                    <option value={6}>6 Ay</option>
                    <option value={12}>12 Ay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aylık Kişi Başı Bütçe (₺) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.seasonal_monthly_budget_per_person}
                    onChange={(e) => setFormData({ ...formData, seasonal_monthly_budget_per_person: e.target.value })}
                    placeholder="Örn: 15000"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            {/* Toplam Maliyet Özeti */}
            {formData.job_type && totalCostWithoutVAT > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Toplam Maliyet Özeti</h3>
                <div className="space-y-1.5 text-sm">
                  {formData.job_type === 'PART_TIME' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kişi Sayısı:</span>
                        <span className="font-medium text-gray-900">{formData.required_count} kişi</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saatlik Kişi Başı Bütçe:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(parseFloat(formData.hourly_budget_per_person || '0'))}</span>
                      </div>
                      {formData.part_time_start_date && formData.part_time_end_date && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Toplam Gün:</span>
                            <span className="font-medium text-gray-900">
                              {(() => {
                                const days = getDaysBetweenDates(formData.part_time_start_date, formData.part_time_end_date);
                                return `${days.length} gün`;
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Toplam Saat:</span>
                            <span className="font-medium text-gray-900">
                              {(() => {
                                const days = getDaysBetweenDates(formData.part_time_start_date, formData.part_time_end_date);
                                let totalHours = 0;
                                days.forEach(day => {
                                  const hours = workingHours[day];
                                  if (hours && hours.start && hours.end) {
                                    const [startHours, startMinutes] = hours.start.split(':').map(Number);
                                    const [endHours, endMinutes] = hours.end.split(':').map(Number);
                                    const startTotalMinutes = startHours * 60 + startMinutes;
                                    const endTotalMinutes = endHours * 60 + endMinutes;
                                    const diffMinutes = endTotalMinutes - startTotalMinutes;
                                    const diffHours = diffMinutes / 60;
                                    totalHours += diffHours;
                                  }
                                });
                                return `${totalHours.toFixed(1)} saat`;
                              })()}
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {formData.job_type === 'SEASONAL' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kişi Sayısı:</span>
                        <span className="font-medium text-gray-900">{formData.required_count} kişi</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aylık Kişi Başı Bütçe:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(parseFloat(formData.seasonal_monthly_budget_per_person || '0'))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dönemsel Süre:</span>
                        <span className="font-medium text-gray-900">{formData.seasonal_period_months} ay</span>
                      </div>
                    </>
                  )}
                  <div className="pt-2 border-t border-blue-200 mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">KDV Hariç Toplam:</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(totalCostWithoutVAT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hizmet Bedeli (%12):</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(serviceFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">KDV (%20):</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-base font-semibold text-gray-900">KDV Dahil Toplam:</span>
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(totalCostWithVAT)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? 'Oluşturuluyor...' : 'Fırsat Oluştur'}
              </button>
              <Link
                href="/dashboard/customer"
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                İptal
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Zaman Limiti Modal */}
      {showTimeLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Uyarı</h3>
              <button
                onClick={() => setShowTimeLimitModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-700 mb-6">{timeLimitMessage}</p>
            <button
              onClick={() => setShowTimeLimitModal(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
