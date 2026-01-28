-- =====================================================
-- MÜŞTERİ ROLÜ ENUM EKLEME (1. ADIM)
-- =====================================================
-- Bu script'i ÖNCE çalıştırın
-- Enum değeri ekleme işlemi commit edilmeli, sonra diğer script çalıştırılmalı
-- =====================================================

-- USER_ROLE ENUM'INA 'CUSTOMER' EKLE
-- NOT: Enum değeri ekleme işlemi commit edilmeli, bu yüzden ayrı bir script
ALTER TYPE user_role ADD VALUE 'CUSTOMER';

-- =====================================================
-- Eğer hata alırsanız (enum değeri zaten varsa), devam edin
-- Sonra add-customer-role-complete.sql script'ini çalıştırın
-- =====================================================
