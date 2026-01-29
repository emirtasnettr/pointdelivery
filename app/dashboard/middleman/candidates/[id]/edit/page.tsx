/**
 * Middleman Aday Düzenleme Sayfası
 * 
 * Middleman'lerin aday adına bilgileri düzenleyebileceği sayfa
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function EditCandidatePage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const candidateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    nationalId: '',
    skills: [] as string[],
    currentSkill: '',
  });

  // Profil ve aday bilgilerini yükle
  useEffect(() => {
    async function loadCandidate() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Middleman profil kontrolü
        const { data: middlemanProfile } = await supabase
          .from('profiles')
          .select('role, id')
          .eq('id', user.id)
          .single();

        if (!middlemanProfile || middlemanProfile.role !== 'MIDDLEMAN') {
          router.push('/');
          return;
        }

        // Aday profilini al (middleman'e bağlı olmalı)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', candidateId)
          .eq('role', 'CANDIDATE')
          .eq('middleman_id', user.id)
          .single();

        if (!profile) {
          setError('Aday bulunamadı veya bu aday size ait değil');
          setLoading(false);
          return;
        }

        // Değerlendirme, Onaylı veya Reddedildi statüsündeyken düzenleme yapılamaz
        if (profile.application_status === 'EVALUATION' || 
            profile.application_status === 'APPROVED' || 
            profile.application_status === 'REJECTED') {
          router.push(`/dashboard/middleman/candidates/${candidateId}`);
          return;
        }

        setFormData((prev) => ({
          ...prev,
          fullName: profile.full_name || '',
        }));

        // Aday bilgilerini al (varsa)
        const { data: candidateInfo } = await supabase
          .from('candidate_info')
          .select('*')
          .eq('profile_id', candidateId)
          .single();

        if (candidateInfo) {
          setFormData((prev) => ({
            ...prev,
            phone: candidateInfo.phone || '',
            email: candidateInfo.email || '',
            address: candidateInfo.address || '',
            dateOfBirth: candidateInfo.date_of_birth || '',
            nationalId: candidateInfo.national_id || '',
            skills: candidateInfo.skills || [],
          }));
        } else {
          // Aday bilgisi yoksa, email'i auth.users'tan almak için API'ye istek yap
          // Ancak RLS nedeniyle doğrudan alamayız, bu yüzden email'i boş bırak
          // Kullanıcı manuel olarak girebilir
        }
      } catch (err: any) {
        setError(err.message || 'Aday bilgileri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    loadCandidate();
  }, [router, supabase, candidateId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addSkill = () => {
    if (formData.currentSkill.trim() && !formData.skills.includes(formData.currentSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, prev.currentSkill.trim()],
        currentSkill: '',
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Giriş yapmamışsınız');
        setSaving(false);
        return;
      }

      // Middleman kontrolü
      const { data: middlemanProfile } = await supabase
        .from('profiles')
        .select('role, id')
        .eq('id', user.id)
        .single();

      if (!middlemanProfile || middlemanProfile.role !== 'MIDDLEMAN') {
        setError('Yetkisiz erişim');
        setSaving(false);
        return;
      }

      // Adayın middleman'e bağlı olduğunu kontrol et
      const { data: candidateProfile } = await supabase
        .from('profiles')
        .select('middleman_id')
        .eq('id', candidateId)
        .single();

      if (!candidateProfile || candidateProfile.middleman_id !== user.id) {
        setError('Bu aday size ait değil');
        setSaving(false);
        return;
      }

      // 1. Profil bilgilerini güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
        })
        .eq('id', candidateId);

      if (profileError) throw profileError;

      // 2. Aday bilgilerini ekle veya güncelle (upsert)
      const { error: candidateError } = await supabase
        .from('candidate_info')
        .upsert({
          profile_id: candidateId,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          date_of_birth: formData.dateOfBirth || null,
          national_id: formData.nationalId || null,
          skills: formData.skills,
        }, { onConflict: 'profile_id' });

      if (candidateError) throw candidateError;

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/middleman/candidates/${candidateId}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında hata oluştu');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/dashboard/middleman/candidates/${candidateId}`}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Aday Detayına Dön
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Aday Bilgilerini Düzenle</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Temel Bilgiler</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ad Soyad"
                />
              </div>
            </div>
          </div>

          {/* İletişim Bilgileri */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">İletişim Bilgileri</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="05XX XXX XX XX"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Adres
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tam adres"
              />
            </div>
          </div>

          {/* Kişisel Bilgiler */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Kişisel Bilgiler</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                  Doğum Tarihi
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-2">
                  TC Kimlik No
                </label>
                <input
                  id="nationalId"
                  name="nationalId"
                  type="text"
                  value={formData.nationalId}
                  onChange={handleChange}
                  maxLength={11}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="11 haneli TC Kimlik No"
                />
              </div>
            </div>
          </div>

          {/* Beceriler */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Beceriler</h2>

            {/* Beceriler */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beceriler
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.currentSkill}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currentSkill: e.target.value }))
                  }
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Beceri ekleyin (Enter)"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ekle
                </button>
              </div>

              {/* Beceri listesi */}
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hata/Success Mesajları */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              ✅ Aday bilgileri başarıyla kaydedildi!
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>

            <Link
              href={`/dashboard/middleman/candidates/${candidateId}`}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
            >
              İptal
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
