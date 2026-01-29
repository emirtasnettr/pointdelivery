/**
 * Candidate Dashboard - Landing Page
 * 
 * Adayların ana sayfası - Hoş geldiniz ve özet bilgiler
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
export default function CandidateDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA' | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    district: '',
    address: '',
    dateOfBirth: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    nationalId: '',
    educationLevel: '',
    experienceYears: '0',
    skills: [] as string[],
    languages: [] as Array<{ name: string; level: string }>,
    currentSkill: '',
    saving: false,
    saveError: null as string | null,
    saveSuccess: false,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [infoLocked, setInfoLocked] = useState(false);
  const [jobStats, setJobStats] = useState({
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [jobAssignments, setJobAssignments] = useState<{
    pending: any[];
    accepted: any[];
    rejected: any[];
  }>({
    pending: [],
    accepted: [],
    rejected: [],
  });
  const [selectedJobAssignment, setSelectedJobAssignment] = useState<any>(null);
  const [jobDetailModalOpen, setJobDetailModalOpen] = useState(false);
  const [loadingJobDetails, setLoadingJobDetails] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [currentDay, setCurrentDay] = useState<Date>(new Date());
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Türkiye illeri ve ilçeleri (kısaltılmış versiyon - gerçek uygulamada API'den gelmeli)
  const turkiyeIller = [
    { il: 'Adana', ilceler: ['Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Kozan', 'İmamoğlu', 'Karataş', 'Pozantı', 'Karaisalı', 'Feke', 'Saimbeyli', 'Tufanbeyli', 'Aladağ', 'Yumurtalık'] },
    { il: 'Adıyaman', ilceler: ['Merkez', 'Besni', 'Çelikhan', 'Gerger', 'Gölbaşı', 'Kahta', 'Samsat', 'Sincik', 'Tut'] },
    { il: 'Afyonkarahisar', ilceler: ['Merkez', 'Başmakçı', 'Bayat', 'Bolvadin', 'Çay', 'Çobanlar', 'Dazkırı', 'Dinar', 'Emirdağ', 'Evciler', 'Hocalar', 'İhsaniye', 'İscehisar', 'Kızılören', 'Sandıklı', 'Sinanpaşa', 'Şuhut'] },
    { il: 'Ağrı', ilceler: ['Merkez', 'Diyadin', 'Doğubayazıt', 'Eleşkirt', 'Hamur', 'Patnos', 'Taşlıçay', 'Tutak'] },
    { il: 'Amasya', ilceler: ['Merkez', 'Göynücek', 'Gümüşhacıköy', 'Hamamözü', 'Merzifon', 'Suluova', 'Taşova'] },
    { il: 'Ankara', ilceler: ['Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kalecik', 'Kazan', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle', 'Akyurt'] },
    { il: 'Antalya', ilceler: ['Akseki', 'Aksu', 'Alanya', 'Demre', 'Döşemealtı', 'Elmalı', 'Finike', 'Gazipaşa', 'Gündoğmuş', 'İbradı', 'Kaş', 'Kemer', 'Kepez', 'Konyaaltı', 'Korkuteli', 'Kumluca', 'Manavgat', 'Muratpaşa', 'Serik'] },
    { il: 'Artvin', ilceler: ['Merkez', 'Ardanuç', 'Arhavi', 'Borçka', 'Hopa', 'Murgul', 'Şavşat', 'Yusufeli'] },
    { il: 'Aydın', ilceler: ['Bozdoğan', 'Buharkent', 'Çine', 'Didim', 'Efeler', 'Germencik', 'İncirliova', 'Karacasu', 'Karpuzlu', 'Koçarlı', 'Köşk', 'Kuşadası', 'Kuyucak', 'Merkez', 'Nazilli', 'Söke', 'Sultanhisar', 'Yenipazar'] },
    { il: 'Balıkesir', ilceler: ['Altıeylül', 'Ayvalık', 'Balya', 'Bandırma', 'Bigadiç', 'Burhaniye', 'Dursunbey', 'Edremit', 'Erdek', 'Gömeç', 'Gönen', 'Havran', 'İvrindi', 'Karesi', 'Kepsut', 'Manyas', 'Marmara', 'Merkez', 'Savaştepe', 'Sındırgı', 'Susurluk'] },
    { il: 'Bilecik', ilceler: ['Bozüyük', 'Gölpazarı', 'İnhisar', 'Merkez', 'Osmaneli', 'Pazaryeri', 'Söğüt', 'Yenipazar'] },
    { il: 'Bingöl', ilceler: ['Merkez', 'Adaklı', 'Genç', 'Karlıova', 'Kiğı', 'Solhan', 'Yayladere', 'Yedisu'] },
    { il: 'Bitlis', ilceler: ['Merkez', 'Adilcevaz', 'Ahlat', 'Güroymak', 'Hizan', 'Mutki', 'Tatvan'] },
    { il: 'Bolu', ilceler: ['Merkez', 'Dörtdivan', 'Gerede', 'Göynük', 'Kıbrıscık', 'Mengen', 'Mudurnu', 'Seben', 'Yeniçağa'] },
    { il: 'Burdur', ilceler: ['Merkez', 'Ağlasun', 'Altınyayla', 'Bucak', 'Çavdır', 'Çeltikçi', 'Gölhisar', 'Karamanlı', 'Kemer', 'Tefenni', 'Yeşilova'] },
    { il: 'Bursa', ilceler: ['Nilüfer', 'Osmangazi', 'Yıldırım', 'Büyükorhan', 'Gemlik', 'Gürsu', 'Harmancık', 'İnegöl', 'İznik', 'Karacabey', 'Keles', 'Kestel', 'Mudanya', 'Mustafakemalpaşa', 'Orhaneli', 'Orhangazi', 'Yenişehir'] },
    { il: 'Çanakkale', ilceler: ['Merkez', 'Ayvacık', 'Bayramiç', 'Biga', 'Bozcaada', 'Çan', 'Eceabat', 'Ezine', 'Gelibolu', 'Gökçeada', 'Lapseki', 'Yenice'] },
    { il: 'Çankırı', ilceler: ['Merkez', 'Atkaracalar', 'Bayramören', 'Çerkeş', 'Eldivan', 'Ilgaz', 'Kızılırmak', 'Korgun', 'Kurşunlu', 'Orta', 'Şabanözü', 'Yapraklı'] },
    { il: 'Çorum', ilceler: ['Merkez', 'Alaca', 'Bayat', 'Boğazkale', 'Dodurga', 'İskilip', 'Kargı', 'Laçin', 'Mecitözü', 'Oğuzlar', 'Ortaköy', 'Osmancık', 'Sungurlu', 'Uğurludağ'] },
    { il: 'Denizli', ilceler: ['Merkez', 'Acıpayam', 'Babadağ', 'Baklan', 'Bekilli', 'Beyağaç', 'Bozkurt', 'Buldan', 'Çal', 'Çameli', 'Çardak', 'Çivril', 'Güney', 'Honaz', 'Kale', 'Sarayköy', 'Serinhisar', 'Tavas'] },
    { il: 'Diyarbakır', ilceler: ['Bağlar', 'Bismil', 'Çermik', 'Çınar', 'Çüngüş', 'Dicle', 'Eğil', 'Ergani', 'Hani', 'Hazro', 'Kayapınar', 'Kocaköy', 'Kulp', 'Lice', 'Silvan', 'Sur', 'Yenişehir'] },
    { il: 'Edirne', ilceler: ['Merkez', 'Enez', 'Havsa', 'İpsala', 'Keşan', 'Lalapaşa', 'Meriç', 'Süloğlu', 'Uzunköprü'] },
    { il: 'Elazığ', ilceler: ['Merkez', 'Ağın', 'Alacakaya', 'Arıcak', 'Baskil', 'Karakoçan', 'Keban', 'Kovancılar', 'Maden', 'Palu', 'Sivrice'] },
    { il: 'Erzincan', ilceler: ['Merkez', 'Çayırlı', 'İliç', 'Kemah', 'Kemaliye', 'Otlukbeli', 'Refahiye', 'Tercan', 'Üzümlü'] },
    { il: 'Erzurum', ilceler: ['Merkez', 'Aşkale', 'Aziziye', 'Çat', 'Hınıs', 'Horasan', 'İspir', 'Karaçoban', 'Karayazı', 'Köprüköy', 'Narman', 'Oltu', 'Olur', 'Palandöken', 'Pasinler', 'Pazaryolu', 'Şenkaya', 'Tekman', 'Tortum', 'Uzundere', 'Yakutiye'] },
    { il: 'Eskişehir', ilceler: ['Odunpazarı', 'Tepebaşı', 'Alpu', 'Beylikova', 'Çifteler', 'Günyüzü', 'Han', 'İnönü', 'Mahmudiye', 'Mihalgazi', 'Mihalıççık', 'Sarıcakaya', 'Seyitgazi', 'Sivrihisar'] },
    { il: 'Gaziantep', ilceler: ['Şahinbey', 'Şehitkamil', 'Araban', 'İslahiye', 'Karkamış', 'Nizip', 'Nurdağı', 'Oğuzeli', 'Yavuzeli'] },
    { il: 'Giresun', ilceler: ['Merkez', 'Alucra', 'Bulancak', 'Çamoluk', 'Çanakçı', 'Dereli', 'Doğankent', 'Espiye', 'Eynesil', 'Görele', 'Güce', 'Keşap', 'Piraziz', 'Şebinkarahisar', 'Tirebolu', 'Yağlıdere'] },
    { il: 'Gümüşhane', ilceler: ['Merkez', 'Kelkit', 'Köse', 'Kürtün', 'Şiran', 'Torul'] },
    { il: 'Hakkari', ilceler: ['Merkez', 'Çukurca', 'Şemdinli', 'Yüksekova'] },
    { il: 'Hatay', ilceler: ['Antakya', 'Altınözü', 'Arsuz', 'Belen', 'Defne', 'Dörtyol', 'Erzin', 'Hassa', 'İskenderun', 'Kırıkhan', 'Kumlu', 'Payas', 'Reyhanlı', 'Samandağ', 'Yayladağı'] },
    { il: 'Iğdır', ilceler: ['Merkez', 'Aralık', 'Karakoyunlu', 'Tuzluca'] },
    { il: 'Isparta', ilceler: ['Merkez', 'Aksu', 'Atabey', 'Eğirdir', 'Gelendost', 'Gönen', 'Keçiborlu', 'Senirkent', 'Sütçüler', 'Şarkikaraağaç', 'Uluborlu', 'Yalvaç', 'Yenişarbademli'] },
    { il: 'İstanbul', ilceler: ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'] },
    { il: 'İzmir', ilceler: ['Aliağa', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'] },
    { il: 'Kahramanmaraş', ilceler: ['Merkez', 'Afşin', 'Andırın', 'Çağlayancerit', 'Ekinözü', 'Elbistan', 'Göksun', 'Nurhak', 'Pazarcık', 'Türkoğlu'] },
    { il: 'Karabük', ilceler: ['Merkez', 'Eflani', 'Eskipazar', 'Ovacık', 'Safranbolu', 'Yenice'] },
    { il: 'Karaman', ilceler: ['Merkez', 'Ayrancı', 'Başyayla', 'Ermenek', 'Kazımkarabekir', 'Sarıveliler'] },
    { il: 'Kars', ilceler: ['Merkez', 'Akyaka', 'Arpaçay', 'Digor', 'Kağızman', 'Sarıkamış', 'Selim', 'Susuz'] },
    { il: 'Kastamonu', ilceler: ['Merkez', 'Abana', 'Ağlı', 'Araç', 'Azdavay', 'Bozkurt', 'Cide', 'Çatalzeytin', 'Daday', 'Devrekani', 'Doğanyurt', 'Hanönü', 'İhsangazi', 'İnebolu', 'Küre', 'Pınarbaşı', 'Seydiler', 'Şenpazar', 'Taşköprü', 'Tosya'] },
    { il: 'Kayseri', ilceler: ['Melikgazi', 'Kocasinan', 'Talas', 'Akkışla', 'Bünyan', 'Develi', 'Felahiye', 'Hacılar', 'İncesu', 'Özvatan', 'Pınarbaşı', 'Sarıoğlan', 'Sarız', 'Tomarza', 'Yahyalı', 'Yeşilhisar'] },
    { il: 'Kırıkkale', ilceler: ['Merkez', 'Bahşılı', 'Balışeyh', 'Çelebi', 'Delice', 'Karakeçili', 'Keskin', 'Sulakyurt', 'Yahşihan'] },
    { il: 'Kırklareli', ilceler: ['Merkez', 'Babaeski', 'Demirköy', 'Kofçaz', 'Lüleburgaz', 'Pehlivanköy', 'Pınarhisar', 'Vize'] },
    { il: 'Kırşehir', ilceler: ['Merkez', 'Akçakent', 'Akpınar', 'Boztepe', 'Çiçekdağı', 'Kaman', 'Mucur'] },
    { il: 'Kilis', ilceler: ['Merkez', 'Elbeyli', 'Musabeyli', 'Polateli'] },
    { il: 'Kocaeli', ilceler: ['Gebze', 'Gölcük', 'İzmit', 'Kandıra', 'Karamürsel', 'Kartepe', 'Körfez', 'Derince', 'Başiskele', 'Çayırova', 'Darıca', 'Dilovası'] },
    { il: 'Konya', ilceler: ['Meram', 'Karatay', 'Selçuklu', 'Akören', 'Akşehir', 'Altınekin', 'Beyşehir', 'Bozkır', 'Cihanbeyli', 'Çeltik', 'Çumra', 'Derbent', 'Derebucak', 'Doğanhisar', 'Emirgazi', 'Ereğli', 'Güneysinir', 'Hadim', 'Halkapınar', 'Hüyük', 'Ilgın', 'Kadınhanı', 'Karapınar', 'Kulu', 'Sarayönü', 'Seydişehir', 'Taşkent', 'Tuzlukçu', 'Yalıhüyük', 'Yunak'] },
    { il: 'Kütahya', ilceler: ['Merkez', 'Altıntaş', 'Aslanapa', 'Çavdarhisar', 'Domaniç', 'Dumlupınar', 'Emet', 'Gediz', 'Hisarcık', 'Pazarlar', 'Simav', 'Şaphane', 'Tavşanlı'] },
    { il: 'Malatya', ilceler: ['Battalgazi', 'Yeşilyurt', 'Akçadağ', 'Arapgir', 'Arguvan', 'Darende', 'Doğanşehir', 'Doğanyol', 'Hekimhan', 'Kale', 'Kuluncak', 'Pütürge', 'Yazıhan'] },
    { il: 'Manisa', ilceler: ['Yunusemre', 'Şehzadeler', 'Ahmetli', 'Akhisar', 'Alaşehir', 'Demirci', 'Gölmarmara', 'Gördes', 'Kırkağaç', 'Köprübaşı', 'Kula', 'Salihli', 'Sarıgöl', 'Saruhanlı', 'Selendi', 'Soma', 'Turgutlu'] },
    { il: 'Mardin', ilceler: ['Artuklu', 'Dargeçit', 'Derik', 'Kızıltepe', 'Mazıdağı', 'Midyat', 'Nusaybin', 'Ömerli', 'Savur', 'Yeşilli'] },
    { il: 'Mersin', ilceler: ['Akdeniz', 'Mezitli', 'Toroslar', 'Yenişehir', 'Anamur', 'Aydıncık', 'Bozyazı', 'Çamlıyayla', 'Erdemli', 'Gülnar', 'Mut', 'Silifke', 'Tarsus'] },
    { il: 'Muğla', ilceler: ['Menteşe', 'Bodrum', 'Dalaman', 'Datça', 'Fethiye', 'Kavaklıdere', 'Köyceğiz', 'Marmaris', 'Milas', 'Ortaca', 'Ula', 'Yatağan'] },
    { il: 'Muş', ilceler: ['Merkez', 'Bulanık', 'Hasköy', 'Korkut', 'Malazgirt', 'Varto'] },
    { il: 'Nevşehir', ilceler: ['Merkez', 'Acıgöl', 'Avanos', 'Derinkuyu', 'Gülşehir', 'Hacıbektaş', 'Kozaklı', 'Ürgüp'] },
    { il: 'Niğde', ilceler: ['Merkez', 'Altunhisar', 'Bor', 'Çamardı', 'Çiftlik', 'Ulukışla'] },
    { il: 'Ordu', ilceler: ['Altınordu', 'Akkuş', 'Aybastı', 'Çamaş', 'Çatalpınar', 'Çaybaşı', 'Fatsa', 'Gölköy', 'Gülyalı', 'Gürgentepe', 'İkizce', 'Kabadüz', 'Kabataş', 'Korgan', 'Kumru', 'Mesudiye', 'Perşembe', 'Ulubey', 'Ünye'] },
    { il: 'Osmaniye', ilceler: ['Merkez', 'Bahçe', 'Düziçi', 'Hasanbeyli', 'Kadirli', 'Sumbas', 'Toprakkale'] },
    { il: 'Rize', ilceler: ['Merkez', 'Ardeşen', 'Çamlıhemşin', 'Çayeli', 'Derepazarı', 'Fındıklı', 'Güneysu', 'Hemşin', 'İkizdere', 'İyidere', 'Kalkandere', 'Pazar'] },
    { il: 'Sakarya', ilceler: ['Adapazarı', 'Akyazı', 'Arifiye', 'Erenler', 'Ferizli', 'Geyve', 'Hendek', 'Karapürçek', 'Karasu', 'Kaynarca', 'Kocaali', 'Pamukova', 'Sapanca', 'Serdivan', 'Söğütlü', 'Taraklı'] },
    { il: 'Samsun', ilceler: ['Atakum', 'Canik', 'İlkadım', 'Tekkeköy', 'Alaçam', 'Asarcık', 'Ayvacık', 'Bafra', 'Çarşamba', 'Havza', 'Kavak', 'Ladik', 'Ondokuzmayıs', 'Salıpazarı', 'Terme', 'Vezirköprü', 'Yakakent'] },
    { il: 'Siirt', ilceler: ['Merkez', 'Baykan', 'Eruh', 'Kurtalan', 'Pervari', 'Şirvan', 'Tillo'] },
    { il: 'Sinop', ilceler: ['Merkez', 'Ayancık', 'Boyabat', 'Dikmen', 'Durağan', 'Erfelek', 'Gerze', 'Saraydüzü', 'Türkeli'] },
    { il: 'Sivas', ilceler: ['Merkez', 'Akıncılar', 'Altınyayla', 'Divriği', 'Doğanşar', 'Gemerek', 'Gölova', 'Gürün', 'Hafik', 'İmranlı', 'Kangal', 'Koyulhisar', 'Şarkışla', 'Suşehri', 'Ulaş', 'Yıldızeli', 'Zara'] },
    { il: 'Şanlıurfa', ilceler: ['Haliliye', 'Eyyübiye', 'Karaköprü', 'Akçakale', 'Birecik', 'Bozova', 'Ceylanpınar', 'Halfeti', 'Harran', 'Hilvan', 'Siverek', 'Suruç', 'Viranşehir'] },
    { il: 'Şırnak', ilceler: ['Merkez', 'Beytüşşebap', 'Cizre', 'Güçlükonak', 'İdil', 'Silopi', 'Uludere'] },
    { il: 'Tekirdağ', ilceler: ['Süleymanpaşa', 'Çerkezköy', 'Çorlu', 'Ergene', 'Hayrabolu', 'Kapaklı', 'Malkara', 'Marmaraereğlisi', 'Muratlı', 'Saray', 'Şarköy'] },
    { il: 'Tokat', ilceler: ['Merkez', 'Almus', 'Artova', 'Başçiftlik', 'Erbaa', 'Niksar', 'Pazar', 'Reşadiye', 'Sulusaray', 'Turhal', 'Yeşilyurt', 'Zile'] },
    { il: 'Trabzon', ilceler: ['Ortahisar', 'Akçaabat', 'Araklı', 'Arsin', 'Beşikdüzü', 'Çarşıbaşı', 'Çaykara', 'Dernekpazarı', 'Düzköy', 'Hayrat', 'Köprübaşı', 'Maçka', 'Of', 'Şalpazarı', 'Sürmene', 'Tonya', 'Vakfıkebir', 'Yomra'] },
    { il: 'Tunceli', ilceler: ['Merkez', 'Çemişgezek', 'Hozat', 'Mazgirt', 'Nazımiye', 'Ovacık', 'Pertek', 'Pülümür'] },
    { il: 'Uşak', ilceler: ['Merkez', 'Banaz', 'Eşme', 'Karahallı', 'Sivaslı', 'Ulubey'] },
    { il: 'Van', ilceler: ['İpekyolu', 'Tuşba', 'Edremit', 'Bahçesaray', 'Başkale', 'Çaldıran', 'Çatak', 'Erciş', 'Gevaş', 'Gürpınar', 'Muradiye', 'Özalp', 'Saray'] },
    { il: 'Yalova', ilceler: ['Merkez', 'Altınova', 'Armutlu', 'Çınarcık', 'Çiftlikköy', 'Termal'] },
    { il: 'Yozgat', ilceler: ['Merkez', 'Akdağmadeni', 'Aydıncık', 'Boğazlıyan', 'Çandır', 'Çayıralan', 'Çekerek', 'Kadışehri', 'Saraykent', 'Sarıkaya', 'Sorgun', 'Şefaatli', 'Yerköy', 'Yenifakılı'] },
    { il: 'Zonguldak', ilceler: ['Merkez', 'Alaplı', 'Çaycuma', 'Devrek', 'Gökçebey', 'Kilimli', 'Kozlu'] },
  ];

  // Seçili ile göre ilçeleri filtrele
  const availableDistricts = turkiyeIller.find((il) => il.il === formData.city)?.ilceler || [];

  // Welcome card'ı 5 saniye sonra otomatik kapat
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

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

        // Profil bilgilerini al
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileData || profileData.role !== 'CANDIDATE') {
          router.push('/');
          return;
        }

        setProfile(profileData);

        // Aday bilgilerini al
        const { data: candidateInfoData } = await supabase
          .from('candidate_info')
          .select('*')
          .eq('profile_id', user.id)
          .single();

        setCandidateInfo(candidateInfoData);

        // Bilgilerin kilitli olup olmadığını kontrol et
        // Eğer tüm zorunlu alanlar doluysa, bilgiler kilitli sayılır
        const isInfoLocked = candidateInfoData && 
          candidateInfoData.phone && 
          candidateInfoData.email && 
          candidateInfoData.city && 
          candidateInfoData.district && 
          candidateInfoData.address && 
          candidateInfoData.date_of_birth && 
          candidateInfoData.national_id && 
          profileData.full_name;
        setInfoLocked(!!isInfoLocked);

        // Eğer aday onaylı değilse (application_status !== 'APPROVED')
        // Profil sayfasına yönlendir
        const isApproved = profileData.application_status === 'APPROVED';
        if (!isApproved) {
          setLoading(false);
          router.push('/dashboard/candidate/profile');
          return;
        }

        // Doğum tarihini parse et (YYYY-MM-DD formatından)
        let birthDay = '';
        let birthMonth = '';
        let birthYear = '';
        if (candidateInfoData?.date_of_birth) {
          const dateParts = candidateInfoData.date_of_birth.split('-');
          if (dateParts.length === 3) {
            birthYear = dateParts[0];
            birthMonth = dateParts[1];
            birthDay = dateParts[2];
          }
        }

        // Telefon numarasını formatla (+90 ile başlamıyorsa ekle, başlıyorsa +90'dan sonrasını al)
        let phoneNumber = candidateInfoData?.phone || '';
        if (phoneNumber) {
          if (phoneNumber.startsWith('+90')) {
            phoneNumber = phoneNumber; // Zaten +90 ile başlıyor
          } else if (phoneNumber.startsWith('0')) {
            // 0 ile başlıyorsa 0'ı kaldır ve +90 ekle
            phoneNumber = '+90' + phoneNumber.substring(1);
          } else {
            // Direkt rakamlar ise +90 ekle
            phoneNumber = '+90' + phoneNumber;
          }
        } else {
          phoneNumber = '+90';
        }

        // Form verilerini doldur
        setFormData({
          fullName: profileData.full_name || '',
          phone: phoneNumber,
          email: candidateInfoData?.email || user.email || '',
          city: candidateInfoData?.city || '',
          district: candidateInfoData?.district || '',
          address: candidateInfoData?.address || '',
          dateOfBirth: candidateInfoData?.date_of_birth || '',
          birthDay,
          birthMonth,
          birthYear,
          nationalId: candidateInfoData?.national_id || '',
          skills: candidateInfoData?.skills || [],
          languages: candidateInfoData?.languages || [],
          currentSkill: '',
          saving: false,
          saveError: null,
          saveSuccess: false,
        });

        // Belgeleri al
        const { data: documentsData } = await supabase
          .from('documents')
          .select('*')
          .eq('profile_id', user.id);
        
        setDocuments(documentsData || []);

        // Job assignments verilerini al
        const { data: jobAssignmentsData, error: jobAssignmentsError } = await supabase
          .from('job_assignments')
          .select('*')
          .eq('candidate_id', user.id)
          .order('assigned_at', { ascending: false });

        if (jobAssignmentsError) {
          console.error('Job assignments error:', jobAssignmentsError);
        }

        if (jobAssignmentsData && jobAssignmentsData.length > 0) {
          // Her job assignment için job posting bilgisini al
          const assignmentsWithJobPostings = await Promise.all(
            jobAssignmentsData.map(async (assignment) => {
              const { data: jobPosting, error: jobPostingError } = await supabase
                .from('job_postings')
                .select('*')
                .eq('id', assignment.job_posting_id)
                .single();

              if (jobPostingError) {
                console.error('Job posting error for assignment', assignment.id, ':', jobPostingError);
              }

              return {
                ...assignment,
                job_postings: jobPosting || null,
              };
            })
          );

          const pending = assignmentsWithJobPostings.filter((ja) => ja.status === 'PENDING');
          const accepted = assignmentsWithJobPostings.filter((ja) => ja.status === 'ACCEPTED');
          const rejected = assignmentsWithJobPostings.filter((ja) => ja.status === 'REJECTED');

          setJobStats({
            pending: pending.length,
            accepted: accepted.length,
            rejected: rejected.length,
          });

          setJobAssignments({
            pending,
            accepted,
            rejected,
          });
        }

        // Site logo'yu yükle
        try {
          const { data: settings, error: settingsError } = await supabase
            .from('site_settings')
            .select('logo_url')
            .maybeSingle();
          
          if (!settingsError && settings?.logo_url) {
            setSiteLogo(settings.logo_url);
          }
        } catch (err) {
          console.log('Logo yüklenemedi:', err);
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);


  // Dropdown dışına tıklama kontrolü
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  }, [supabase, router]);

  // Format currency helper
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Takvim helper fonksiyonları
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Ayın ilk gününün haftanın hangi günü olduğunu bul
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Ayın kaç gün olduğunu bul
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Belirli bir tarihe atanan işleri getir
  // job_assignments tablosundan alınan veriler, job_postings'teki başlangıç tarihine göre filtrelenir
  const getJobsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const allJobs = [...jobAssignments.pending, ...jobAssignments.accepted, ...jobAssignments.rejected];
    return allJobs.filter((assignment: any) => {
      if (!assignment.job_postings) return false;
      const job = assignment.job_postings;
      
      // PART_TIME işler için: working_hours içindeki tüm günleri kontrol et
      if (job.job_type === 'PART_TIME' && job.part_time_start_date && job.part_time_end_date && job.working_hours) {
        const startDate = new Date(job.part_time_start_date);
        const endDate = new Date(job.part_time_end_date);
        const checkDate = new Date(dateStr);
        
        // Tarih aralığında mı kontrol et
        if (checkDate >= startDate && checkDate <= endDate) {
          // Bu tarihte çalışma saati var mı kontrol et
          const hours = job.working_hours[dateStr];
          return hours && hours.start && hours.end;
        }
        return false;
      }
      
      // Diğer iş tipleri için: başlangıç tarihini kontrol et
      const startDate = job.start_date || job.part_time_start_date || job.contract_start_date;
      if (startDate) {
        const jobDate = new Date(startDate).toISOString().split('T')[0];
        return jobDate === dateStr;
      }
      
      // Eğer başlangıç tarihi yoksa, atanma tarihine göre göster (fallback)
      if (assignment.assigned_at) {
        const assignedDate = new Date(assignment.assigned_at).toISOString().split('T')[0];
        return assignedDate === dateStr;
      }
      return false;
    });
  };

  // Önceki ay/hafta/gün
  const previousPeriod = () => {
    if (viewMode === 'month') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else if (viewMode === 'week') {
      const prevWeek = new Date(currentWeek);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentWeek(prevWeek);
    } else if (viewMode === 'day') {
      const prevDay = new Date(currentDay);
      prevDay.setDate(prevDay.getDate() - 1);
      setCurrentDay(prevDay);
    }
  };

  // Sonraki ay/hafta/gün
  const nextPeriod = () => {
    if (viewMode === 'month') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else if (viewMode === 'week') {
      const nextWeek = new Date(currentWeek);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentWeek(nextWeek);
    } else if (viewMode === 'day') {
      const nextDay = new Date(currentDay);
      nextDay.setDate(nextDay.getDate() + 1);
      setCurrentDay(nextDay);
    }
  };

  // Bugünü ayarla
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setCurrentWeek(now);
    setCurrentDay(now);
  };

  // Haftanın başlangıç gününü bul (Pazartesi)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
    return new Date(d.setDate(diff));
  };

  // Haftanın günlerini getir
  const getWeekDays = (date: Date) => {
    const start = getWeekStart(date);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  // Get job type label
  const getJobTypeLabel = (jobType: string | null | undefined) => {
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

  // Handle accept job assignment
  const handleAcceptJob = async (assignmentId: string) => {
    setProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('Giriş yapmamışsınız');
        setProcessing(false);
        return;
      }

      const { error } = await supabase
        .from('job_assignments')
        .update({
          status: 'ACCEPTED',
          responded_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .eq('candidate_id', user.id);

      if (error) throw error;

      // Refresh job assignments
      const { data: jobAssignmentsData } = await supabase
        .from('job_assignments')
        .select('*, job_postings(*)')
        .eq('candidate_id', user.id)
        .order('assigned_at', { ascending: false });

      if (jobAssignmentsData && jobAssignmentsData.length > 0) {
        const assignmentsWithJobPostings = await Promise.all(
          jobAssignmentsData.map(async (assignment) => {
            const { data: jobPosting } = await supabase
              .from('job_postings')
              .select('*')
              .eq('id', assignment.job_posting_id)
              .single();

            return {
              ...assignment,
              job_postings: jobPosting || null,
            };
          })
        );

        const pending = assignmentsWithJobPostings.filter((ja) => ja.status === 'PENDING');
        const accepted = assignmentsWithJobPostings.filter((ja) => ja.status === 'ACCEPTED');
        const rejected = assignmentsWithJobPostings.filter((ja) => ja.status === 'REJECTED');

        setJobStats({
          pending: pending.length,
          accepted: accepted.length,
          rejected: rejected.length,
        });

        setJobAssignments({
          pending,
          accepted,
          rejected,
        });
      }

      // Update selected assignment
      const updatedAssignment = jobAssignmentsData?.find((ja) => ja.id === assignmentId);
      if (updatedAssignment) {
        const { data: jobPosting } = await supabase
          .from('job_postings')
          .select('*')
          .eq('id', updatedAssignment.job_posting_id)
          .single();
        
        setSelectedJobAssignment({
          ...updatedAssignment,
          job_postings: jobPosting || null,
        });
      }

      alert('Fırsat başarıyla kabul edildi!');
    } catch (err: any) {
      console.error('Error accepting job:', err);
      alert('Fırsat kabul edilirken hata oluştu: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject job assignment
  const handleRejectJob = async () => {
    if (!selectedJobAssignment) return;

    if (!rejectReason || rejectReason.trim().length < 10) {
      alert('Lütfen en az 10 karakter açıklama giriniz.');
      return;
    }

    setProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('Giriş yapmamışsınız');
        setProcessing(false);
        return;
      }

      const { error } = await supabase
        .from('job_assignments')
        .update({
          status: 'REJECTED',
          rejection_reason: rejectReason.trim(),
          responded_at: new Date().toISOString(),
        })
        .eq('id', selectedJobAssignment.id)
        .eq('candidate_id', user.id);

      if (error) throw error;

      // Refresh job assignments
      const { data: jobAssignmentsData } = await supabase
        .from('job_assignments')
        .select('*, job_postings(*)')
        .eq('candidate_id', user.id)
        .order('assigned_at', { ascending: false });

      if (jobAssignmentsData && jobAssignmentsData.length > 0) {
        const assignmentsWithJobPostings = await Promise.all(
          jobAssignmentsData.map(async (assignment) => {
            const { data: jobPosting } = await supabase
              .from('job_postings')
              .select('*')
              .eq('id', assignment.job_posting_id)
              .single();

            return {
              ...assignment,
              job_postings: jobPosting || null,
            };
          })
        );

        const pending = assignmentsWithJobPostings.filter((ja) => ja.status === 'PENDING');
        const accepted = assignmentsWithJobPostings.filter((ja) => ja.status === 'ACCEPTED');
        const rejected = assignmentsWithJobPostings.filter((ja) => ja.status === 'REJECTED');

        setJobStats({
          pending: pending.length,
          accepted: accepted.length,
          rejected: rejected.length,
        });

        setJobAssignments({
          pending,
          accepted,
          rejected,
        });
      }

      // Update selected assignment
      const updatedAssignment = jobAssignmentsData?.find((ja) => ja.id === selectedJobAssignment.id);
      if (updatedAssignment) {
        const { data: jobPosting } = await supabase
          .from('job_postings')
          .select('*')
          .eq('id', updatedAssignment.job_posting_id)
          .single();
        
        setSelectedJobAssignment({
          ...updatedAssignment,
          job_postings: jobPosting || null,
        });
      }

      setShowRejectModal(false);
      setRejectReason('');
      alert('Fırsat başarıyla reddedildi.');
    } catch (err: any) {
      console.error('Error rejecting job:', err);
      alert('Fırsat reddedilirken hata oluştu: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Calculate part-time total hours
  const calculatePartTimeTotalHours = (jobPosting: any): number => {
    if (!jobPosting?.working_hours || !jobPosting.part_time_start_date || !jobPosting.part_time_end_date) return 0;
    
    const startDate = new Date(jobPosting.part_time_start_date);
    const endDate = new Date(jobPosting.part_time_end_date);
    const days: string[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days.push(dateStr);
    }
    
    let totalMinutes = 0;
    days.forEach(day => {
      const hours = jobPosting.working_hours?.[day];
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

  // Calculate candidate earning
  const calculateCandidateEarning = (assignment: any) => {
    if (!assignment || !assignment.job_postings) return null;

    const jobPosting = assignment.job_postings;
    const jobType = jobPosting.job_type;

    if (jobType === 'PART_TIME') {
      // Part-time için: saatlik ücret * toplam çalışma saati
      const hourlyRate = assignment.candidate_daily_salary || jobPosting.hourly_budget_per_person; // candidate_daily_salary aslında hourly_budget_per_person olarak kaydediliyor
      if (hourlyRate && jobPosting.part_time_start_date && jobPosting.part_time_end_date) {
        const totalHours = calculatePartTimeTotalHours(jobPosting);
        if (totalHours > 0) {
          return hourlyRate * totalHours;
        }
      }
    } else if (jobType === 'FULL_TIME') {
      // Full-time için: aylık ücret
      return assignment.candidate_monthly_salary || jobPosting.monthly_budget_per_person || null;
    } else if (jobType === 'SEASONAL') {
      // Seasonal için: aylık ücret * dönemsel süre
      const monthlyRate = assignment.candidate_monthly_salary || jobPosting.monthly_budget_per_person;
      if (monthlyRate && jobPosting.seasonal_period_months) {
        return monthlyRate * jobPosting.seasonal_period_months;
      }
    }

    return null;
  };

  // Onay modalından gelen kayıt işlemi
  const handleConfirmSave = useCallback(async () => {
    setShowConfirmModal(false);
    setFormData((prev) => ({ ...prev, saving: true, saveError: null, saveSuccess: false }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFormData((prev) => ({ ...prev, saving: false, saveError: 'Giriş yapmamışsınız' }));
        return;
      }

      // 1. Profil bilgilerini güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Candidate info'yu güncelle veya oluştur
      const { error: candidateInfoError } = await supabase
        .from('candidate_info')
        .upsert({
          profile_id: user.id,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          district: formData.district,
          address: formData.address,
          date_of_birth: formData.dateOfBirth,
          national_id: formData.nationalId,
          skills: formData.skills,
          languages: formData.languages,
        }, {
          onConflict: 'profile_id'
        });

      if (candidateInfoError) throw candidateInfoError;

      // Başarılı kayıt
      setFormData((prev) => ({ ...prev, saving: false, saveSuccess: true }));
      setInfoLocked(true);
    } catch (err: any) {
      setFormData((prev) => ({ ...prev, saving: false, saveError: err.message || 'Kayıt sırasında bir hata oluştu' }));
    }
  }, [formData, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#16B24B] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard/candidate/profile" className="inline-flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pointdlogo.webp" alt="Point Delivery" className="w-auto" style={{ height: '42px', width: 'auto' }} />
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#16B24B] flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {profile?.full_name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{profile?.full_name || 'Aday'}</p>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                  <div className="py-1.5">
                    {infoLocked && (
                      <>
                        <Link
                          href="/dashboard/candidate/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#16B24B]/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Profil Bilgileri</p>
                            <p className="text-xs text-gray-400">Kişisel bilgilerinizi görüntüleyin</p>
                          </div>
                        </Link>
                        <div className="h-px bg-gray-100 my-1"></div>
                      </>
                    )}
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-[#16B24B]/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Hesap Ayarları</p>
                        <p className="text-xs text-gray-400">Şifre ve profil ayarları</p>
                      </div>
                    </Link>
                    
                    <div className="h-px bg-gray-100 my-1"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-red-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-600">Çıkış Yap</p>
                        <p className="text-xs text-gray-400">Hesabınızdan çıkış yapın</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Takvim Görünümü */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            {/* Takvim Başlık */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">İş Takvimim</h1>
                <p className="text-sm text-gray-500 mt-1">Size atanan iş fırsatlarını takvim görünümünde görüntüleyin</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Görünüm Seçimi */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'month'
                        ? 'bg-white text-[#16B24B] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Aylık
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'week'
                        ? 'bg-white text-[#16B24B] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Haftalık
                  </button>
                  <button
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'day'
                        ? 'bg-white text-[#16B24B] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Günlük
                  </button>
                </div>
                <button
                  onClick={previousPeriod}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  title={viewMode === 'month' ? 'Önceki Ay' : viewMode === 'week' ? 'Önceki Hafta' : 'Önceki Gün'}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bugün
                </button>
                <button
                  onClick={nextPeriod}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  title={viewMode === 'month' ? 'Sonraki Ay' : viewMode === 'week' ? 'Sonraki Hafta' : 'Sonraki Gün'}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tarih Başlığı */}
            <div className="mb-6 text-center">
              {viewMode === 'month' && (
                <h2 className="text-3xl font-bold text-gray-900">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
              )}
              {viewMode === 'week' && (() => {
                const weekStart = getWeekStart(currentWeek);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return (
                  <h2 className="text-3xl font-bold text-gray-900">
                    {weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} -{' '}
                    {weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h2>
                );
              })()}
              {viewMode === 'day' && (
                <h2 className="text-3xl font-bold text-gray-900">
                  {currentDay.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
              )}
            </div>

            {/* Aylık Görünüm - Kompakt */}
            {viewMode === 'month' && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Takvim Grid */}
                <div className="grid grid-cols-7 border-b border-gray-200">
                  {/* Gün İsimleri */}
                  {dayNames.map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2 bg-gray-50 border-r border-gray-200 last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Takvim Günleri */}
                <div className="grid grid-cols-7">
                  {/* Boş hücreler (ayın ilk gününden önce) */}
                  {Array.from({ length: (getFirstDayOfMonth(currentYear, currentMonth) + 6) % 7 }, (_, i) => (
                    <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-gray-200 last:border-r-0"></div>
                  ))}

                  {/* Günler */}
                  {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => {
                    const day = i + 1;
                    const date = new Date(currentYear, currentMonth, day);
                    const jobsForDate = getJobsForDate(date);
                    const isToday = 
                      date.getDate() === new Date().getDate() &&
                      date.getMonth() === new Date().getMonth() &&
                      date.getFullYear() === new Date().getFullYear();

                    return (
                      <div
                        key={day}
                        onClick={() => {
                          if (jobsForDate.length > 0) {
                            setSelectedDate(date);
                            setJobDetailModalOpen(true);
                            setSelectedJobAssignment(jobsForDate[0]);
                          }
                        }}
                        className={`min-h-[80px] p-1.5 border-r border-b border-gray-200 last:border-r-0 cursor-pointer transition-all ${
                          isToday
                            ? 'bg-[#16B24B]/10'
                            : 'bg-white hover:bg-gray-50'
                        } ${jobsForDate.length > 0 ? 'hover:bg-[#16B24B]/10' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${isToday ? 'text-[#16B24B] font-bold' : 'text-gray-700'}`}>
                            {day}
                          </span>
                          {jobsForDate.length > 0 && (
                            <span className="text-[10px] font-semibold text-[#16B24B] bg-[#16B24B]/20 px-1 py-0.5 rounded">
                              {jobsForDate.length}
                            </span>
                          )}
                        </div>
                        {jobsForDate.length > 0 && (
                          <div className="space-y-0.5">
                            {jobsForDate.slice(0, 1).map((assignment: any, idx: number) => (
                              <div
                                key={idx}
                                className={`text-[10px] px-1 py-0.5 rounded truncate ${
                                  assignment.status === 'ACCEPTED'
                                    ? 'bg-green-100 text-green-700'
                                    : assignment.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                                title={assignment.job_postings?.title || 'İş İlanı'}
                              >
                                {assignment.job_postings?.title || 'İş İlanı'}
                              </div>
                            ))}
                            {jobsForDate.length > 1 && (
                              <div className="text-[10px] text-gray-500 font-medium">
                                +{jobsForDate.length - 1} daha
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Haftalık Görünüm - Modern ve Düzenli */}
            {viewMode === 'week' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-8 border-b border-gray-200 max-h-[700px] overflow-y-auto">
                  {/* Sol sütun - Saatler */}
                  <div className="border-r border-gray-200 bg-gray-50/50 sticky left-0 z-20 min-w-[60px]">
                    <div className="h-14 border-b border-gray-200"></div>
                    {Array.from({ length: 13 }, (_, i) => {
                      const hour = i + 8; // 08:00 - 20:00
                      return (
                        <div key={hour} className="h-12 border-b border-gray-100 flex items-start justify-end pr-3 pt-1">
                          <span className="text-xs text-gray-600 font-medium">{hour.toString().padStart(2, '0')}:00</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Günler */}
                  {getWeekDays(currentWeek).map((day, idx) => {
                    const jobsForDate = getJobsForDate(day);
                    const isToday = 
                      day.getDate() === new Date().getDate() &&
                      day.getMonth() === new Date().getMonth() &&
                      day.getFullYear() === new Date().getFullYear();

                    // Her iş için pozisyon hesapla (sadece bir kez render et)
                    const jobBlocks = jobsForDate.map((assignment: any) => {
                      if (!assignment.job_postings) return null;
                      const job = assignment.job_postings;
                      
                      // PART_TIME işler için working_hours kontrolü
                      if (job.job_type === 'PART_TIME' && job.working_hours) {
                        const dateStr = day.toISOString().split('T')[0];
                        const hours = job.working_hours[dateStr];
                        if (!hours || !hours.start || !hours.end) return null;
                        
                        const [startH, startM] = hours.start.split(':').map(Number);
                        const [endH, endM] = hours.end.split(':').map(Number);
                        
                        // 08:00-20:00 arası için pozisyon hesapla (her saat 48px = h-12)
                        // 08:00 = 0px, 09:00 = 48px, 10:00 = 96px, ...
                        let topPx = 0;
                        let heightPx = 0;
                        
                        if (startH < 8) {
                          // 08:00'dan önce başlıyorsa 08:00'a hizala
                          topPx = 0;
                          const startTotalMinutes = startH * 60 + startM;
                          const endTotalMinutes = endH * 60 + endM;
                          const totalMinutes = endTotalMinutes - startTotalMinutes;
                          heightPx = (totalMinutes / 60) * 48;
                          
                          // 20:00'dan sonra bitiyorsa 20:00'da kes
                          if (endH > 20) {
                            const minutesTo20 = (20 - startH) * 60 - startM;
                            heightPx = (minutesTo20 / 60) * 48;
                          }
                        } else if (startH >= 8 && startH <= 20) {
                          // 08:00-20:00 arasında
                          // Her saat 48px yükseklikte
                          // 09:00-17:00 için: 09:00 satırından başla, 17:00 satırının sonuna kadar git
                          const startMinutes = startH * 60 + startM;
                          const endMinutes = endH * 60 + endM;
                          const startMinutesFrom8 = startMinutes - (8 * 60);
                          const endMinutesFrom8 = endMinutes - (8 * 60);
                          
                          // Başlangıç pozisyonu: saat satırının başlangıcı
                          topPx = (startMinutesFrom8 / 60) * 48;
                          
                          // Bitiş pozisyonu: bitiş saatinden sonraki saat satırının başlangıcı
                          // Örnek: 17:00'da bitiyorsa, 17:00 satırının sonuna kadar git (18:00 satırının başına kadar)
                          const endTopPx = ((endMinutesFrom8 + 60) / 60) * 48; // Bitiş saatinden sonraki saat
                          heightPx = endTopPx - topPx;
                          
                          // 20:00'dan sonra bitiyorsa 20:00'da kes (20:00 satırının sonu = 21:00 satırının başı = 13*48 = 624px)
                          if (endH >= 20) {
                            const maxEndPx = 13 * 48; // 20:00 satırının sonu (21:00 satırının başı)
                            heightPx = Math.min(heightPx, maxEndPx - topPx);
                          }
                        } else {
                          return null;
                        }
                        
                        return {
                          assignment,
                          top: topPx,
                          height: Math.max(heightPx, 32),
                          hours,
                        };
                      }
                      
                      // Diğer iş tipleri için başlangıç saatini kullan
                      if (job.start_date) {
                        const jobDate = new Date(job.start_date);
                        if (jobDate.getDate() === day.getDate() && jobDate.getMonth() === day.getMonth()) {
                          const startH = jobDate.getHours();
                          const startM = jobDate.getMinutes();
                          
                          if (startH < 8 || startH > 20) return null;
                          
                          const topPx = ((startH - 8) * 60 + startM) / 60 * 48;
                          
                          return {
                            assignment,
                            top: topPx,
                            height: 48, // Varsayılan 1 saat
                            hours: null,
                          };
                        }
                      }
                      
                      return null;
                    }).filter(Boolean);

                    return (
                      <div key={idx} className={`border-r border-gray-200 last:border-r-0 relative ${isToday ? 'bg-[#16B24B]/5' : 'bg-white'}`}>
                        {/* Gün başlığı */}
                        <div className={`h-14 border-b border-gray-200 flex flex-col items-center justify-center px-2 sticky top-0 z-10 ${isToday ? 'bg-[#16B24B]/20 border-[#16B24B]/40' : 'bg-gray-50'}`}>
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{dayNames[idx]}</div>
                          <div className={`text-base font-bold mt-0.5 ${isToday ? 'text-[#16B24B]' : 'text-gray-900'}`}>
                            {day.getDate()}
                          </div>
                        </div>
                        
                        {/* Saat slotları - 08:00-20:00 */}
                        <div className="relative" style={{ height: '624px' }}>
                          {Array.from({ length: 13 }, (_, i) => {
                            const hour = i + 8; // 08:00 - 20:00
                            return (
                              <div
                                key={hour}
                                className="h-12 border-b border-gray-100 relative hover:bg-gray-50/30 transition-colors"
                              />
                            );
                          })}
                          
                          {/* İş blokları - Tek parça olarak */}
                          {jobBlocks.map((block: any, blockIdx: number) => {
                            if (!block) return null;
                            const { assignment, top, height, hours } = block;
                            const job = assignment.job_postings;
                            
                            return (
                              <div
                                key={blockIdx}
                                onClick={() => {
                                  setSelectedDate(day);
                                  setJobDetailModalOpen(true);
                                  setSelectedJobAssignment(assignment);
                                }}
                                className={`absolute left-1 right-1 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all hover:shadow-lg z-10 border-l-4 ${
                                  assignment.status === 'ACCEPTED'
                                    ? 'bg-green-50 border-green-500 text-green-900 hover:bg-green-100'
                                    : assignment.status === 'PENDING'
                                    ? 'bg-yellow-50 border-yellow-500 text-yellow-900 hover:bg-yellow-100'
                                    : 'bg-red-50 border-red-500 text-red-900 hover:bg-red-100'
                                }`}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  minHeight: '32px',
                                }}
                              >
                                <div className="font-semibold truncate mb-0.5">
                                  {job.title || 'İş İlanı'}
                                </div>
                                {hours && (
                                  <div className="text-xs opacity-75">
                                    {hours.start} - {hours.end}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Günlük Görünüm */}
            {viewMode === 'day' && (
              <div className="space-y-4">
                <div className={`border rounded-lg p-6 ${
                  currentDay.getDate() === new Date().getDate() &&
                  currentDay.getMonth() === new Date().getMonth() &&
                  currentDay.getFullYear() === new Date().getFullYear()
                    ? 'bg-[#16B24B]/10 border-[#16B24B]/40 ring-2 ring-[#16B24B]'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {currentDay.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getJobsForDate(currentDay).length} iş atanmış
                    </div>
                  </div>
                  <div className="space-y-3">
                    {getJobsForDate(currentDay).length > 0 ? (
                      getJobsForDate(currentDay).map((assignment: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedDate(currentDay);
                            setJobDetailModalOpen(true);
                            setSelectedJobAssignment(assignment);
                          }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
                            assignment.status === 'ACCEPTED'
                              ? 'bg-green-50 border-green-200 hover:bg-green-100'
                              : assignment.status === 'PENDING'
                              ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                              : 'bg-red-50 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {assignment.job_postings?.title || 'İş İlanı'}
                              </h3>
                              {assignment.job_postings?.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                  {assignment.job_postings.description}
                                </p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              assignment.status === 'ACCEPTED'
                                ? 'bg-green-100 text-green-700'
                                : assignment.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {assignment.status === 'ACCEPTED' ? 'Kabul Edildi' :
                               assignment.status === 'PENDING' ? 'Beklemede' :
                               'Reddedildi'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            {assignment.job_postings?.job_type && (
                              <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">İş Tipi</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {getJobTypeLabel(assignment.job_postings.job_type)}
                                </div>
                              </div>
                            )}
                            {assignment.job_postings?.city && assignment.job_postings?.district && (
                              <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Konum</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {assignment.job_postings.city} / {assignment.job_postings.district}
                                </div>
                              </div>
                            )}
                            {assignment.job_postings?.start_date && (
                              <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Başlangıç</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatDate(assignment.job_postings.start_date)}
                                </div>
                              </div>
                            )}
                            {assignment.assigned_at && (
                              <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Atanma Tarihi</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatDate(assignment.assigned_at)}
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Kabul/Reddet Butonları - Sadece PENDING durumunda */}
                          {assignment.status === 'PENDING' && (
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptJob(assignment.id);
                                }}
                                disabled={processing}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Kabul Et
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedJobAssignment(assignment);
                                  setShowRejectModal(true);
                                }}
                                disabled={processing}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-sm font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reddet
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-500">Bu gün için atanmış iş bulunmuyor</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fırsatlar Tabloları */}
          <div className="mt-8 space-y-6">
            {/* Aktif Fırsatlar */}
            {jobAssignments.accepted.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Aktif Fırsatlar ({jobAssignments.accepted.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fırsat Başlığı</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İş Tipi</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Konum</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tarih/Saat</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kazanç</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobAssignments.accepted.map((assignment: any) => {
                        const job = assignment.job_postings;
                        if (!job) return null;
                        
                        const earning = calculateCandidateEarning(assignment);
                        let dateTimeInfo = '-';
                        
                        if (job.job_type === 'PART_TIME' && job.working_hours && job.part_time_start_date && job.part_time_end_date) {
                          const startDate = new Date(job.part_time_start_date);
                          const endDate = new Date(job.part_time_end_date);
                          const dateStr = startDate.toISOString().split('T')[0];
                          const hours = job.working_hours[dateStr];
                          if (hours) {
                            dateTimeInfo = `${formatDate(job.part_time_start_date)} - ${formatDate(job.part_time_end_date)} (${hours.start}-${hours.end})`;
                          } else {
                            dateTimeInfo = `${formatDate(job.part_time_start_date)} - ${formatDate(job.part_time_end_date)}`;
                          }
                        } else if (job.job_type === 'FULL_TIME' && job.contract_start_date) {
                          dateTimeInfo = `${formatDate(job.contract_start_date)}${job.contract_end_date ? ` - ${formatDate(job.contract_end_date)}` : ''}`;
                        } else if (job.job_type === 'SEASONAL' && job.start_date) {
                          dateTimeInfo = `${formatDate(job.start_date)} (${job.seasonal_period_months} ay)`;
                        }
                        
                        return (
                          <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{job.title || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{getJobTypeLabel(job.job_type)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {job.city && job.district ? `${job.city} / ${job.district}` : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 max-w-xs">{dateTimeInfo}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-green-600">
                                {formatCurrency(earning)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Kabul Edildi
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedDate(new Date());
                                  setJobDetailModalOpen(true);
                                  setSelectedJobAssignment(assignment);
                                }}
                                className="text-[#16B24B] hover:text-[#118836] text-sm font-medium"
                              >
                                Detay
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Onay Bekleyen Fırsatlar */}
            {jobAssignments.pending.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Onay Bekleyen Fırsatlar ({jobAssignments.pending.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fırsat Başlığı</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İş Tipi</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Konum</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tarih/Saat</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kazanç</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobAssignments.pending.map((assignment: any) => {
                        const job = assignment.job_postings;
                        if (!job) return null;
                        
                        const earning = calculateCandidateEarning(assignment);
                        let dateTimeInfo = '-';
                        
                        if (job.job_type === 'PART_TIME' && job.working_hours && job.part_time_start_date && job.part_time_end_date) {
                          const startDate = new Date(job.part_time_start_date);
                          const dateStr = startDate.toISOString().split('T')[0];
                          const hours = job.working_hours[dateStr];
                          if (hours) {
                            dateTimeInfo = `${formatDate(job.part_time_start_date)} - ${formatDate(job.part_time_end_date)} (${hours.start}-${hours.end})`;
                          } else {
                            dateTimeInfo = `${formatDate(job.part_time_start_date)} - ${formatDate(job.part_time_end_date)}`;
                          }
                        } else if (job.job_type === 'FULL_TIME' && job.contract_start_date) {
                          dateTimeInfo = `${formatDate(job.contract_start_date)}${job.contract_end_date ? ` - ${formatDate(job.contract_end_date)}` : ''}`;
                        } else if (job.job_type === 'SEASONAL' && job.start_date) {
                          dateTimeInfo = `${formatDate(job.start_date)} (${job.seasonal_period_months} ay)`;
                        }
                        
                        return (
                          <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{job.title || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{getJobTypeLabel(job.job_type)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {job.city && job.district ? `${job.city} / ${job.district}` : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 max-w-xs">{dateTimeInfo}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-yellow-600">
                                {formatCurrency(earning)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                Beklemede
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedDate(new Date());
                                  setJobDetailModalOpen(true);
                                  setSelectedJobAssignment(assignment);
                                }}
                                className="text-[#16B24B] hover:text-[#118836] text-sm font-medium"
                              >
                                Detay
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Kaçan Fırsatlar */}
            {jobAssignments.rejected.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Kaçan Fırsatlar ({jobAssignments.rejected.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fırsat Başlığı</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İş Tipi</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Konum</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tarih/Saat</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kazanç</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reddetme Nedeni</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobAssignments.rejected.map((assignment: any) => {
                        const job = assignment.job_postings;
                        if (!job) return null;
                        
                        const earning = calculateCandidateEarning(assignment);
                        let dateTimeInfo = '-';
                        
                        if (job.job_type === 'PART_TIME' && job.working_hours && job.part_time_start_date && job.part_time_end_date) {
                          const startDate = new Date(job.part_time_start_date);
                          const dateStr = startDate.toISOString().split('T')[0];
                          const hours = job.working_hours[dateStr];
                          if (hours) {
                            dateTimeInfo = `${formatDate(job.part_time_start_date)} - ${formatDate(job.part_time_end_date)} (${hours.start}-${hours.end})`;
                          } else {
                            dateTimeInfo = `${formatDate(job.part_time_start_date)} - ${formatDate(job.part_time_end_date)}`;
                          }
                        } else if (job.job_type === 'FULL_TIME' && job.contract_start_date) {
                          dateTimeInfo = `${formatDate(job.contract_start_date)}${job.contract_end_date ? ` - ${formatDate(job.contract_end_date)}` : ''}`;
                        } else if (job.job_type === 'SEASONAL' && job.start_date) {
                          dateTimeInfo = `${formatDate(job.start_date)} (${job.seasonal_period_months} ay)`;
                        }
                        
                        return (
                          <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{job.title || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{getJobTypeLabel(job.job_type)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {job.city && job.district ? `${job.city} / ${job.district}` : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 max-w-xs">{dateTimeInfo}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-red-600">
                                {formatCurrency(earning)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 max-w-md">
                                {assignment.rejection_reason || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedDate(new Date());
                                  setJobDetailModalOpen(true);
                                  setSelectedJobAssignment(assignment);
                                }}
                                className="text-[#16B24B] hover:text-[#118836] text-sm font-medium"
                              >
                                Detay
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Seçili Tarih İş Detayları Modal */}
          {selectedDate && jobDetailModalOpen && selectedJobAssignment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-[#16B24B] text-white px-5 py-3 flex items-center justify-between rounded-t-xl">
                  <h3 className="text-base font-bold">
                    {selectedJobAssignment.job_postings?.title || 'Fırsat Detayı'}
                  </h3>
                  <button
                    onClick={() => {
                      setJobDetailModalOpen(false);
                      setSelectedDate(null);
                      setSelectedJobAssignment(null);
                    }}
                    className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-5">
                  {loadingJobDetails ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#16B24B] rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600 text-sm">Yükleniyor...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Durum Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          selectedJobAssignment.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                          selectedJobAssignment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedJobAssignment.status === 'ACCEPTED' ? 'Kabul Edildi' :
                           selectedJobAssignment.status === 'PENDING' ? 'Beklemede' :
                           'Reddedildi'}
                        </span>
                        {selectedJobAssignment.job_postings?.job_type && (
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                            {getJobTypeLabel(selectedJobAssignment.job_postings.job_type)}
                          </span>
                        )}
                      </div>

                      {/* Açıklama */}
                      {selectedJobAssignment.job_postings?.description && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {selectedJobAssignment.job_postings.description}
                          </p>
                        </div>
                      )}

                      {/* Bilgi Grid - Kompakt */}
                      <div className="grid grid-cols-2 gap-2">
                        {selectedJobAssignment.job_postings?.city && selectedJobAssignment.job_postings?.district && (
                          <div className="bg-[#16B24B]/10 rounded-lg px-3 py-2 border border-[#16B24B]/20">
                            <p className="text-[10px] font-semibold text-[#16B24B] uppercase mb-0.5">Konum</p>
                            <p className="text-xs font-bold text-gray-900 leading-tight">
                              {selectedJobAssignment.job_postings.city} / {selectedJobAssignment.job_postings.district}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Tarih Bilgileri - Kompakt */}
                      {selectedJobAssignment.job_postings?.job_type === 'FULL_TIME' && (
                        <div className="bg-[#16B24B]/10 rounded-lg px-3 py-2 border border-[#16B24B]/20">
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Tarih:</span>{' '}
                            {formatDate(selectedJobAssignment.job_postings.contract_start_date)}
                            {selectedJobAssignment.job_postings.contract_end_date && ` - ${formatDate(selectedJobAssignment.job_postings.contract_end_date)}`}
                          </p>
                        </div>
                      )}

                      {selectedJobAssignment.job_postings?.job_type === 'PART_TIME' && selectedJobAssignment.job_postings.part_time_start_date && selectedJobAssignment.job_postings.part_time_end_date && (
                        <>
                          <div className="bg-[#16B24B]/10 rounded-lg px-3 py-2 border border-[#16B24B]/20">
                            <p className="text-xs text-gray-700">
                              <span className="font-semibold">Tarih:</span>{' '}
                              {formatDate(selectedJobAssignment.job_postings.part_time_start_date)} - {formatDate(selectedJobAssignment.job_postings.part_time_end_date)}
                            </p>
                          </div>

                          {/* Çalışma Saatleri Detayları - Kompakt */}
                          {selectedJobAssignment.job_postings.working_hours && (() => {
                            const startDate = new Date(selectedJobAssignment.job_postings.part_time_start_date);
                            const endDate = new Date(selectedJobAssignment.job_postings.part_time_end_date);
                            const days: string[] = [];
                            
                            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                              const dateStr = d.toISOString().split('T')[0];
                              days.push(dateStr);
                            }

                            const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
                            const daysWithHours = days.filter(day => {
                              const hours = selectedJobAssignment.job_postings.working_hours?.[day];
                              return hours && hours.start && hours.end;
                            });

                            if (daysWithHours.length === 0) return null;

                            return (
                              <div className="bg-[#16B24B]/10 border border-[#16B24B]/20 rounded-lg p-3">
                                <h3 className="text-xs font-semibold text-gray-700 mb-2">Çalışma Saatleri</h3>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                  {daysWithHours.map((day) => {
                                    const date = new Date(day);
                                    const dayName = dayNames[date.getDay()];
                                    const dayFormatted = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
                                    const hours = selectedJobAssignment.job_postings.working_hours[day];
                                    
                                    const [startH, startM] = hours.start.split(':').map(Number);
                                    const [endH, endM] = hours.end.split(':').map(Number);
                                    const startTotalMinutes = startH * 60 + startM;
                                    const endTotalMinutes = endH * 60 + endM;
                                    const diffMinutes = endTotalMinutes - startTotalMinutes;
                                    const diffHours = Math.floor(diffMinutes / 60);
                                    const diffMins = diffMinutes % 60;

                                    return (
                                      <div key={day} className="bg-white rounded px-2.5 py-1.5 border border-indigo-200 flex items-center justify-between text-xs">
                                        <span className="font-medium text-gray-900">{dayFormatted} - {dayName}</span>
                                        <span className="text-gray-600">{hours.start} - {hours.end}</span>
                                        <span className="font-semibold text-[#16B24B]">{diffHours}s{diffMins > 0 ? ` ${diffMins}d` : ''}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}

                      {selectedJobAssignment.job_postings?.job_type === 'SEASONAL' && (
                        <div className="bg-[#16B24B]/10 rounded-lg px-3 py-2 border border-[#16B24B]/20">
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Süre:</span>{' '}
                            {selectedJobAssignment.job_postings.seasonal_period_months} ay
                          </p>
                        </div>
                      )}

                      {/* Kazanç Bilgisi - Kompakt */}
                      {(() => {
                        const earning = calculateCandidateEarning(selectedJobAssignment);
                        if (!earning) return null;
                        return (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-semibold text-green-700 uppercase mb-0.5">Toplam Kazanç</p>
                                <p className="text-lg font-bold text-green-700">
                                  {formatCurrency(earning)}
                                </p>
                                {selectedJobAssignment.job_postings?.job_type === 'PART_TIME' && (
                                  <p className="text-[10px] text-gray-600 mt-0.5">
                                    {(() => {
                                      const totalHours = calculatePartTimeTotalHours(selectedJobAssignment.job_postings);
                                      const hourlyRate = selectedJobAssignment.candidate_daily_salary || selectedJobAssignment.job_postings.hourly_budget_per_person;
                                      return `${formatCurrency(hourlyRate)}/saat × ${totalHours.toFixed(1)} saat`;
                                    })()}
                                  </p>
                                )}
                              </div>
                              <svg className="w-8 h-8 text-green-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Kabul/Reddet Butonları - Kompakt */}
                      {selectedJobAssignment.status === 'PENDING' && (
                        <div className="flex gap-2 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleAcceptJob(selectedJobAssignment.id)}
                            disabled={processing}
                            className="flex-1 px-3 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {processing ? 'İşleniyor...' : 'Kabul Et'}
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={processing}
                            className="flex-1 px-3 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-sm font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reddet
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reddet Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Fırsatı Reddet</h3>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reddetme Nedeni <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Lütfen reddetme nedeninizi açıklayın (en az 10 karakter)"
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {rejectReason.length}/10 karakter (minimum 10 karakter gerekli)
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectReason('');
                      }}
                      disabled={processing}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleRejectJob}
                      disabled={processing || !rejectReason || rejectReason.trim().length < 10}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                      {processing ? 'İşleniyor...' : 'Reddet'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
    </div>
  );
}
